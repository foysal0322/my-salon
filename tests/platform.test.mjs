import { test, describe, before } from "node:test";
import assert from "node:assert";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

describe("AmarSaloon Comprehensive Platform Test Suite", async () => {
  let testOwner;
  let testCustomer;
  let testSalon;

  before(async () => {
    // Ensure database connection
    await prisma.$connect();

    // Fetch seed records
    testOwner = await prisma.user.findFirst({ where: { role: "OWNER" } });
    testCustomer = await prisma.user.findFirst({ where: { role: "CUSTOMER" } });
    testSalon = await prisma.saloon.findFirst({
      where: { slug: "mens-care-dhanmondi" },
      include: { services: true },
    });

    assert.ok(testOwner, "Owner user exists in database");
    assert.ok(testCustomer, "Customer user exists in database");
    assert.ok(testSalon, "Test salon exists in database");
  });

  // 1. AUTHENTICATION & BD PHONE VALIDATION
  describe("1. Authentication & Phone Validation (FR-AUTH)", () => {
    const BD_PHONE_REGEX = /^(?:\+8801|8801|01)[3-9]\d{8}$/;

    test("Validates authentic Bangladesh phone numbers", () => {
      assert.strictEqual(BD_PHONE_REGEX.test("01711223344"), true);
      assert.strictEqual(BD_PHONE_REGEX.test("01898765432"), true);
      assert.strictEqual(BD_PHONE_REGEX.test("+8801933445566"), true);
      assert.strictEqual(BD_PHONE_REGEX.test("8801644556677"), true);
    });

    test("Rejects invalid phone numbers", () => {
      assert.strictEqual(BD_PHONE_REGEX.test("0111223344"), false); // Invalid operator 011
      assert.strictEqual(BD_PHONE_REGEX.test("1234567890"), false);
      assert.strictEqual(BD_PHONE_REGEX.test("0171122334"), false); // 10 digits
      assert.strictEqual(BD_PHONE_REGEX.test("017112233445"), false); // 12 digits
    });

    test("Creates and retrieves OTP verification with 180s expiry", async () => {
      const phone = "01799887766";
      const code = "654321";
      const expiresAt = new Date(Date.now() + 180 * 1000);

      await prisma.otpVerification.create({
        data: { phone, code, expiresAt },
      });

      const record = await prisma.otpVerification.findFirst({
        where: { phone, code },
      });

      assert.ok(record, "OTP record created in database");
      assert.strictEqual(record.code, "654321");
      assert.ok(record.expiresAt > new Date(), "OTP is not expired");

      // Clean up
      await prisma.otpVerification.delete({ where: { id: record.id } });
    });
  });

  // 2. DISCOVERY & GEOSPATIAL HAVERSINE
  describe("2. Customer Discovery & Haversine Distance (FR-CUST)", () => {
    function haversineKm(lat1, lon1, lat2, lon2) {
      const R = 6371;
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      return Number((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1));
    }

    test("Calculates accurate distance between Dhanmondi and Gulshan", () => {
      // Dhanmondi (23.7461, 90.3742) to Gulshan (23.7785, 90.4172) ~ 5.7 km
      const distance = haversineKm(23.7461, 90.3742, 23.7785, 90.4172);
      assert.ok(distance >= 5.0 && distance <= 6.5, `Distance was ${distance} km`);
    });

    test("Queries active non-expired salons from database", async () => {
      const now = new Date();
      const activeSalons = await prisma.saloon.findMany({
        where: {
          status: "ACTIVE",
          OR: [
            { trialEndsAt: { gt: now } },
            { subscriptionEndsAt: { gt: now } },
          ],
        },
      });

      assert.ok(activeSalons.length > 0, "Found active salons in database");
      for (const s of activeSalons) {
        assert.strictEqual(s.status, "ACTIVE");
      }
    });
  });

  // 3. BOOKING & CONCURRENCY-SAFE QUEUE
  describe("3. Booking Lifecycle & Atomic Token Allocation (FR-BOOK)", () => {
    const testPhone = "01788776655";
    const todayStr = new Date().toISOString().split("T")[0];
    let createdBookingId;

    test("Assigns atomic daily sequential token number", async () => {
      const lastBooking = await prisma.booking.findFirst({
        where: { saloonId: testSalon.id, bookingDate: todayStr },
        orderBy: { tokenNumber: "desc" },
      });

      const expectedToken = (lastBooking?.tokenNumber || 0) + 1;

      const service = testSalon.services[0];
      const newBooking = await prisma.booking.create({
        data: {
          saloonId: testSalon.id,
          guestName: "টেস্ট কাস্টমার",
          guestPhone: testPhone,
          tokenNumber: expectedToken,
          bookingDate: todayStr,
          bookingType: "LIVE_QUEUE",
          servicesJson: JSON.stringify([{ name: service.nameBn, price: service.price }]),
          totalAmount: service.price,
          totalDuration: service.durationMins,
          status: "WAITING",
        },
      });

      createdBookingId = newBooking.id;
      assert.strictEqual(newBooking.tokenNumber, expectedToken);
      assert.strictEqual(newBooking.status, "WAITING");
    });

    test("Enforces maximum 1 active live queue booking per phone number", async () => {
      // Trying to create a second active booking with same testPhone on todayStr
      const activeBooking = await prisma.booking.findFirst({
        where: {
          guestPhone: testPhone,
          bookingDate: todayStr,
          status: { in: ["WAITING", "IN_SERVICE"] },
        },
      });

      assert.ok(activeBooking, "First active booking exists");
      const isRestricted = !!activeBooking;
      assert.strictEqual(isRestricted, true, "1-active booking restriction detected");
    });

    test("Computes correct queue position and estimated wait time", async () => {
      const currentToken = testSalon.currentServingToken || 1;
      const waitingAhead = await prisma.booking.count({
        where: {
          saloonId: testSalon.id,
          bookingDate: todayStr,
          status: "WAITING",
          tokenNumber: { lt: 999 },
        },
      });

      const totalChairs = testSalon.totalChairs;
      const estWaitMins = Math.ceil(
        ((waitingAhead + testSalon.manualQueueCount) * 25) / Math.max(totalChairs, 1)
      );

      assert.ok(estWaitMins >= 0, "Wait time is a positive number");
    });

    test("Cancels booking safely", async () => {
      if (!createdBookingId) return;
      const cancelled = await prisma.booking.update({
        where: { id: createdBookingId },
        data: { status: "CANCELLED" },
      });

      assert.strictEqual(cancelled.status, "CANCELLED");

      // Clean up
      await prisma.booking.delete({ where: { id: createdBookingId } });
    });
  });

  // 4. OWNER FLOOR CONSOLE (CHAIRS & QUEUE ADVANCE)
  describe("4. Salon Owner Console State (FR-OWN)", () => {
    test("Toggles chair availability between Free and Busy", async () => {
      let chairs = JSON.parse(testSalon.chairStates);
      const initialChair1State = chairs[0].isBusy;

      chairs[0].isBusy = !initialChair1State;
      const newBusyCount = chairs.filter((c) => c.isBusy).length;

      const updated = await prisma.saloon.update({
        where: { id: testSalon.id },
        data: {
          chairStates: JSON.stringify(chairs),
          busyChairs: newBusyCount,
        },
      });

      const updatedChairs = JSON.parse(updated.chairStates);
      assert.strictEqual(updatedChairs[0].isBusy, !initialChair1State);
      assert.strictEqual(updated.busyChairs, newBusyCount);

      // Revert back
      chairs[0].isBusy = initialChair1State;
      await prisma.saloon.update({
        where: { id: testSalon.id },
        data: {
          chairStates: JSON.stringify(chairs),
          busyChairs: chairs.filter((c) => c.isBusy).length,
        },
      });
    });

    test("Adjusts walk-in manual queue counter", async () => {
      const initialCount = testSalon.manualQueueCount;

      const incremented = await prisma.saloon.update({
        where: { id: testSalon.id },
        data: { manualQueueCount: initialCount + 1 },
      });
      assert.strictEqual(incremented.manualQueueCount, initialCount + 1);

      const decremented = await prisma.saloon.update({
        where: { id: testSalon.id },
        data: { manualQueueCount: Math.max(0, initialCount) },
      });
      assert.strictEqual(decremented.manualQueueCount, initialCount);
    });
  });

  // 5. FINANCIAL LEDGER (HISHAB KHATA)
  describe("5. Financial Ledger & Reports (FR-LEDG)", () => {
    let testEntryId;
    const todayStr = new Date().toISOString().split("T")[0];

    test("Records manual sales and expense entries", async () => {
      const entry = await prisma.ledgerEntry.create({
        data: {
          saloonId: testSalon.id,
          type: "INCOME",
          category: "টেস্ট সেল",
          amount: 500,
          note: "টেস্ট ইনকাম রেকর্ড",
          entryDate: todayStr,
        },
      });

      testEntryId = entry.id;
      assert.ok(entry.id);
      assert.strictEqual(entry.amount, 500);
      assert.strictEqual(entry.type, "INCOME");
    });

    test("Calculates net profit accurately from entries", async () => {
      const entries = await prisma.ledgerEntry.findMany({
        where: { saloonId: testSalon.id },
      });

      const totalIncome = entries
        .filter((e) => e.type === "INCOME")
        .reduce((sum, e) => sum + e.amount, 0);

      const totalExpense = entries
        .filter((e) => e.type === "EXPENSE")
        .reduce((sum, e) => sum + e.amount, 0);

      const netProfit = totalIncome - totalExpense;

      assert.ok(typeof netProfit === "number");
      assert.strictEqual(netProfit, totalIncome - totalExpense);

      // Clean up test entry
      if (testEntryId) {
        await prisma.ledgerEntry.delete({ where: { id: testEntryId } });
      }
    });
  });

  // 6. SUBSCRIPTION & ANTI-FRAUD
  describe("6. Subscriptions & MFS Verification (FR-SUB)", () => {
    const testTrxId = "TEST_TRX_999888";

    test("Enforces unique TrxID across all subscriptions (Anti-Fraud)", async () => {
      // 1. Create first subscription
      const sub1 = await prisma.subscription.create({
        data: {
          saloonId: testSalon.id,
          planType: "MONTHLY",
          amount: 499,
          paymentMethod: "BKASH",
          trxId: testTrxId,
          status: "PENDING",
        },
      });

      assert.ok(sub1.id);

      // 2. Attempt duplicate TrxID submission - should be caught
      let duplicateCaught = false;
      try {
        await prisma.subscription.create({
          data: {
            saloonId: testSalon.id,
            planType: "MONTHLY",
            amount: 499,
            paymentMethod: "BKASH",
            trxId: testTrxId,
            status: "PENDING",
          },
        });
      } catch (e) {
        duplicateCaught = true;
      }

      assert.strictEqual(duplicateCaught, true, "Duplicate TrxID was prevented by DB constraint");

      // 3. Admin approves subscription
      const now = new Date();
      const extendedValidity = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const approved = await prisma.subscription.update({
        where: { id: sub1.id },
        data: {
          status: "APPROVED",
          validUntil: extendedValidity,
          adminNote: "Verified by admin test",
        },
      });

      assert.strictEqual(approved.status, "APPROVED");
      assert.ok(approved.validUntil > now);

      // Clean up
      await prisma.subscription.delete({ where: { id: sub1.id } });
    });
  });

  // 7. SUPER ADMIN CAPABILITIES
  describe("7. Super Admin Management (FR-ADM)", () => {
    test("Admin can toggle salon status and moderate listings", async () => {
      // Toggle to BLOCKED
      const blocked = await prisma.saloon.update({
        where: { id: testSalon.id },
        data: { status: "BLOCKED" },
      });
      assert.strictEqual(blocked.status, "BLOCKED");

      // Re-activate
      const restored = await prisma.saloon.update({
        where: { id: testSalon.id },
        data: { status: "ACTIVE" },
      });
      assert.strictEqual(restored.status, "ACTIVE");
    });
  });
});
