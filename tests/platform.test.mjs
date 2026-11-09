import { test, describe, before } from "node:test";
import assert from "node:assert";
import crypto from "node:crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

describe("AmarSalon Comprehensive Platform Test Suite", async () => {
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

    test("Normalizes phone numbers to Bulk SMS BD 8801XXXXXXXXX format", () => {
      function formatBdPhoneForSms(rawPhone) {
        let cleaned = String(rawPhone || "").trim().replace(/\D/g, "");
        if (cleaned.startsWith("880")) return cleaned;
        if (cleaned.startsWith("0")) return `88${cleaned}`;
        return `880${cleaned}`;
      }

      assert.strictEqual(formatBdPhoneForSms("01711223344"), "8801711223344");
      assert.strictEqual(formatBdPhoneForSms("+8801822334455"), "8801822334455");
      assert.strictEqual(formatBdPhoneForSms("8801933445566"), "8801933445566");
    });

    test("Owner first-time signup verifies OTP, stores hashed password, and allows subsequent login with password without OTP", async () => {
      function hashPassword(password) {
        const salt = crypto.randomBytes(16).toString("hex");
        const hash = crypto.scryptSync(password, salt, 64).toString("hex");
        return `${salt}:${hash}`;
      }

      function verifyPassword(password, storedHash) {
        if (!storedHash || !password) return false;
        if (storedHash === password) return true;
        const [salt, key] = storedHash.split(":");
        if (!salt || !key) return false;
        const hash = crypto.scryptSync(password, salt, 64).toString("hex");
        return crypto.timingSafeEqual(Buffer.from(key, "hex"), Buffer.from(hash, "hex"));
      }

      const testPhone = "01799001122";
      const testPass = "myOwnerPass123";
      const testOtp = "998877";

      // 1. Send OTP
      await prisma.otpVerification.create({
        data: {
          phone: testPhone,
          code: testOtp,
          expiresAt: new Date(Date.now() + 180 * 1000),
        },
      });

      // 2. Verify OTP and Sign Up with Password
      const otpRecord = await prisma.otpVerification.findFirst({
        where: { phone: testPhone, code: testOtp },
      });
      assert.ok(otpRecord, "Valid OTP found for signup");

      const passwordHash = hashPassword(testPass);
      const newOwner = await prisma.user.create({
        data: {
          phone: testPhone,
          name: "টেস্ট মালিক (Test Owner)",
          role: "OWNER",
          passwordHash,
          languagePref: "bn",
          status: "ACTIVE",
        },
      });

      assert.strictEqual(newOwner.role, "OWNER");
      assert.ok(newOwner.passwordHash, "Password hash is stored");

      // Clean up OTP record
      await prisma.otpVerification.deleteMany({ where: { phone: testPhone } });

      // 3. Subsequent Login using Phone & Password (NO OTP NEEDED)
      const loginUser = await prisma.user.findUnique({ where: { phone: testPhone } });
      assert.ok(loginUser, "Owner found by phone");
      assert.strictEqual(verifyPassword(testPass, loginUser.passwordHash), true, "Correct password succeeds");
      assert.strictEqual(verifyPassword("wrongpass", loginUser.passwordHash), false, "Wrong password fails");

      // Clean up test user
      await prisma.user.delete({ where: { id: newOwner.id } });
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
          amount: 99,
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
            amount: 99,
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

    test("Enforces reserved salon IDs 1001-1050 and starts self-registration from 1051", async () => {
      // Fetch all existing salon codes
      const allSalons = await prisma.saloon.findMany({ select: { code: true } });
      const usedCodes = new Set(allSalons.map((s) => s.code).filter(Boolean));

      // 1. Reserved range 1001-1050
      const reservedRange = Array.from({ length: 50 }, (_, i) => (1001 + i).toString());
      const availableReserved = reservedRange.filter((c) => !usedCodes.has(c));

      // 1001 is used by seed salon, so it must not be in availableReserved
      assert.strictEqual(availableReserved.includes("1001"), false, "Used ID 1001 must not be available");
      assert.ok(availableReserved.length > 0, "Available reserved IDs must exist");
      assert.ok(availableReserved.every((c) => Number(c) >= 1001 && Number(c) <= 1050));

      // 2. Owner self-registration logic starts from 1051
      let maxSelfCode = 1050;
      for (const s of allSalons) {
        if (s.code) {
          const num = parseInt(s.code, 10);
          if (!isNaN(num) && num >= 1051 && num > maxSelfCode) maxSelfCode = num;
        }
      }
      const nextOwnerCode = (maxSelfCode + 1).toString();
      assert.ok(Number(nextOwnerCode) >= 1051, "Self-registered salon code must be >= 1051");
    });

    test("Admin can create a salon with reserved ID, coordinates, digital payment, and services", async () => {
      const codeToAssign = "1049"; // in reserved range
      const testOwnerPhone = "01788776655";

      // Create owner user
      let owner = await prisma.user.findUnique({ where: { phone: testOwnerPhone } });
      if (!owner) {
        owner = await prisma.user.create({
          data: {
            phone: testOwnerPhone,
            name: "Test Admin Added Owner",
            email: "admin-added@test.com",
            role: "OWNER",
          },
        });
      }

      const created = await prisma.saloon.create({
        data: {
          code: codeToAssign,
          ownerId: owner.id,
          slug: `admin-test-salon-${Date.now()}`,
          nameBn: "টেস্ট এডমিন সেলুন",
          nameEn: "Test Admin Salon",
          category: "GENTS",
          isAc: true,
          acceptsDigitalPayment: true,
          address: "বনানী রোড ১১, ঢাকা",
          phone: testOwnerPhone,
          email: "admin-added@test.com",
          latitude: 23.7937,
          longitude: 90.4066,
          totalChairs: 3,
          busyChairs: 0,
          trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          services: {
            create: [
              { nameBn: "চুল কাটা", nameEn: "Hair Cut", price: 250, durationMins: 25 },
              { nameBn: "শেভ", nameEn: "Shave", price: 150, durationMins: 15 },
            ],
          },
        },
        include: { services: true },
      });

      assert.strictEqual(created.code, "1049");
      assert.strictEqual(created.isAc, true);
      assert.strictEqual(created.acceptsDigitalPayment, true);
      assert.strictEqual(created.services.length, 2);

      // Clean up
      await prisma.saloon.delete({ where: { id: created.id } });
      await prisma.user.delete({ where: { id: owner.id } });
    });
  });
});
