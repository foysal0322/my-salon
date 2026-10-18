import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting database seed...");

  // Clean existing data
  await prisma.favoriteSalon.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.ledgerEntry.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.salonService.deleteMany();
  await prisma.saloon.deleteMany();
  await prisma.otpVerification.deleteMany();
  await prisma.user.deleteMany();

  // 1. Create Super Admin
  const admin = await prisma.user.create({
    data: {
      phone: "01700000000",
      name: "Super Admin",
      role: "ADMIN",
      languagePref: "bn",
      status: "ACTIVE",
    },
  });

  // 2. Create Salon Owners
  const owner1 = await prisma.user.create({
    data: {
      phone: "01711223344",
      name: "রফিকুল ইসলাম (Rafiqul Islam)",
      role: "OWNER",
      languagePref: "bn",
      status: "ACTIVE",
    },
  });

  const owner2 = await prisma.user.create({
    data: {
      phone: "01822334455",
      name: "নুসরাত জাহান (Nusrat Jahan)",
      role: "OWNER",
      languagePref: "bn",
      status: "ACTIVE",
    },
  });

  const owner3 = await prisma.user.create({
    data: {
      phone: "01933445566",
      name: "কামরুল হাসান (Kamrul Hasan)",
      role: "OWNER",
      languagePref: "en",
      status: "ACTIVE",
    },
  });

  // 3. Create Customers
  const customer1 = await prisma.user.create({
    data: {
      phone: "01712345678",
      name: "তানভীর আহমেদ (Tanvir Ahmed)",
      role: "CUSTOMER",
      languagePref: "bn",
      status: "ACTIVE",
    },
  });

  const customer2 = await prisma.user.create({
    data: {
      phone: "01898765432",
      name: "ফারহানা রহমান (Farhana Rahman)",
      role: "CUSTOMER",
      languagePref: "bn",
      status: "ACTIVE",
    },
  });

  const now = new Date();
  const trialEnds = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const subEnds = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
  const todayStr = now.toISOString().split("T")[0];

  // 4. Create Salons
  // Salon 1: Men's Care Dhanmondi
  const salon1 = await prisma.saloon.create({
    data: {
      ownerId: owner1.id,
      slug: "mens-care-dhanmondi",
      nameBn: "মেনজ কেয়ার সেলুন অ্যান্ড স্পা",
      nameEn: "Men's Care Salon & Spa",
      category: "GENTS",
      isAc: true,
      address: "বাড়ি #২৭, রোড #৭/এ, ধানমন্ডি, ঢাকা - ১২০৯",
      phone: "01711223344",
      latitude: 23.7461,
      longitude: 90.3742,
      totalChairs: 4,
      busyChairs: 2,
      chairStates: JSON.stringify([
        { chairNo: 1, isBusy: true },
        { chairNo: 2, isBusy: false },
        { chairNo: 3, isBusy: true },
        { chairNo: 4, isBusy: false },
      ]),
      manualQueueCount: 1,
      currentServingToken: 3,
      status: "ACTIVE",
      trialEndsAt: trialEnds,
      subscriptionEndsAt: subEnds,
      coverImage: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&auto=format&fit=crop&q=60",
    },
  });

  // Salon 2: Royal Cut Mirpur
  const salon2 = await prisma.saloon.create({
    data: {
      ownerId: owner1.id,
      slug: "royal-cut-mirpur",
      nameBn: "রয়্যাল কাট সেলুন",
      nameEn: "Royal Cut Salon",
      category: "GENTS",
      isAc: false,
      address: "প্লট #১২, ব্লক #বি, মিরপুর-১০ গোলচত্বর, ঢাকা - ১২১৬",
      phone: "01711223344",
      latitude: 23.8069,
      longitude: 90.3687,
      totalChairs: 3,
      busyChairs: 1,
      chairStates: JSON.stringify([
        { chairNo: 1, isBusy: true },
        { chairNo: 2, isBusy: false },
        { chairNo: 3, isBusy: false },
      ]),
      manualQueueCount: 0,
      currentServingToken: 1,
      status: "ACTIVE",
      trialEndsAt: trialEnds,
      coverImage: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&auto=format&fit=crop&q=60",
    },
  });

  // Salon 3: Glow & Glamour Banani
  const salon3 = await prisma.saloon.create({
    data: {
      ownerId: owner2.id,
      slug: "glow-glamour-banani",
      nameBn: "গ্লো অ্যান্ড গ্ল্যামার বিউটি পার্লার",
      nameEn: "Glow & Glamour Beauty Parlour",
      category: "LADIES",
      isAc: true,
      address: "রোড #১১, ব্লক #ডি, বনানী, ঢাকা - ১২১৩",
      phone: "01822334455",
      latitude: 23.7937,
      longitude: 90.4066,
      totalChairs: 5,
      busyChairs: 3,
      chairStates: JSON.stringify([
        { chairNo: 1, isBusy: true },
        { chairNo: 2, isBusy: true },
        { chairNo: 3, isBusy: true },
        { chairNo: 4, isBusy: false },
        { chairNo: 5, isBusy: false },
      ]),
      manualQueueCount: 2,
      currentServingToken: 5,
      status: "ACTIVE",
      trialEndsAt: trialEnds,
      coverImage: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&auto=format&fit=crop&q=60",
    },
  });

  // Salon 4: Elite Unisex Gulshan
  const salon4 = await prisma.saloon.create({
    data: {
      ownerId: owner3.id,
      slug: "elite-unisex-gulshan",
      nameBn: "এলিট ইউনিসেক্স সেলুন অ্যান্ড স্টুডিও",
      nameEn: "Elite Unisex Salon & Studio",
      category: "UNISEX",
      isAc: true,
      address: "গুলশান এভিনিউ, গুলশান-১, ঢাকা - ১২১২",
      phone: "01933445566",
      latitude: 23.7785,
      longitude: 90.4172,
      totalChairs: 6,
      busyChairs: 2,
      chairStates: JSON.stringify([
        { chairNo: 1, isBusy: true },
        { chairNo: 2, isBusy: false },
        { chairNo: 3, isBusy: true },
        { chairNo: 4, isBusy: false },
        { chairNo: 5, isBusy: false },
        { chairNo: 6, isBusy: false },
      ]),
      manualQueueCount: 0,
      currentServingToken: 2,
      status: "ACTIVE",
      trialEndsAt: trialEnds,
      coverImage: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=800&auto=format&fit=crop&q=60",
    },
  });

  // 5. Create Services for Salon 1 (Men's Care)
  const servicesSalon1 = [
    { nameBn: "চুল কাটা (Hair Cut)", nameEn: "Hair Cutting", price: 250, durationMins: 25, details: "প্রফেশনাল হেয়ারকাট ও ব্লো-ড্রাই" },
    { nameBn: "দাড়ি শেভ ও ট্রিম (Beard Trim/Shave)", nameEn: "Beard Shave & Trim", price: 150, durationMins: 15, details: "হট টাওয়েল ও আফটারশেভ লোশন সহ" },
    { nameBn: "গোল্ডেন ফেসিয়াল (Golden Facial)", nameEn: "Golden Facial", price: 800, durationMins: 45, details: "ত্বকের উজ্জ্বলতা বৃদ্ধিকারী ডিপ ক্লিনজিং" },
    { nameBn: "হেড ম্যাসাজ ও অয়েলিং (Head Massage)", nameEn: "Head Massage & Oiling", price: 300, durationMins: 20, details: "হার্বাল এসেনশিয়াল অয়েল ম্যাসাজ" },
    { nameBn: "চুল কালার / ডাই (Hair Color)", nameEn: "Hair Color", price: 700, durationMins: 40, details: "আমোনিয়া ফ্রি প্রিমিয়াম কালার" },
  ];

  for (const s of servicesSalon1) {
    await prisma.salonService.create({
      data: {
        saloonId: salon1.id,
        nameBn: s.nameBn,
        nameEn: s.nameEn,
        price: s.price,
        durationMins: s.durationMins,
        details: s.details,
      },
    });
  }

  // Services for Salon 3 (Glow & Glamour)
  const servicesSalon3 = [
    { nameBn: "পার্টি মেকআপ (Party Makeup)", nameEn: "Party Makeup", price: 2500, durationMins: 60, details: "লং লাস্টিং এইচডি গ্ল্যামার লুক" },
    { nameBn: "ব্রাইডাল ফেসিয়াল (Bridal Facial)", nameEn: "Bridal Facial", price: 2000, durationMins: 50, details: "ত্বকের বিশেষ গ্লো এবং ব্রাইটনিং" },
    { nameBn: "ম্যানিকিউর ও পেডিকিউর (Mani-Pedi)", nameEn: "Manicure & Pedicure", price: 1200, durationMins: 45, details: "স্ক্রাবিং ও নেইল পলিশিং" },
    { nameBn: "ভ্রু প্লাক ও থ্রেডিং (Eyebrow Threading)", nameEn: "Eyebrow Threading", price: 100, durationMins: 10, details: "পারফেক্ট শেপ থ্রেডিং" },
    { nameBn: "হেয়ার স্পা ও ট্রিটমেন্ট (Hair Spa)", nameEn: "Hair Spa", price: 1500, durationMins: 45, details: "ড্যামেজ রিপেয়ার ডিপ কন্ডিশনিং" },
  ];

  for (const s of servicesSalon3) {
    await prisma.salonService.create({
      data: {
        saloonId: salon3.id,
        nameBn: s.nameBn,
        nameEn: s.nameEn,
        price: s.price,
        durationMins: s.durationMins,
        details: s.details,
      },
    });
  }

  // 6. Favorites
  await prisma.favoriteSalon.create({
    data: {
      userId: customer1.id,
      saloonId: salon1.id,
    },
  });

  await prisma.favoriteSalon.create({
    data: {
      userId: customer2.id,
      saloonId: salon3.id,
    },
  });

  // 7. Bookings
  // Booking 1: In Service
  await prisma.booking.create({
    data: {
      saloonId: salon1.id,
      customerId: customer1.id,
      guestName: "তানভীর আহমেদ",
      guestPhone: "01712345678",
      tokenNumber: 3,
      bookingDate: todayStr,
      bookingType: "LIVE_QUEUE",
      servicesJson: JSON.stringify([{ name: "চুল কাটা", price: 250, durationMins: 25 }]),
      totalAmount: 250,
      totalDuration: 25,
      status: "IN_SERVICE",
    },
  });

  // Booking 2: Waiting
  await prisma.booking.create({
    data: {
      saloonId: salon1.id,
      guestName: "শাকিল মাহমুদ",
      guestPhone: "01755667788",
      tokenNumber: 4,
      bookingDate: todayStr,
      bookingType: "LIVE_QUEUE",
      servicesJson: JSON.stringify([
        { name: "চুল কাটা", price: 250, durationMins: 25 },
        { name: "দাড়ি শেভ", price: 150, durationMins: 15 },
      ]),
      totalAmount: 400,
      totalDuration: 40,
      status: "WAITING",
    },
  });

  // Booking 3: Waiting
  await prisma.booking.create({
    data: {
      saloonId: salon1.id,
      guestName: "জাহিদ হাসান",
      guestPhone: "01844332211",
      tokenNumber: 5,
      bookingDate: todayStr,
      bookingType: "LIVE_QUEUE",
      servicesJson: JSON.stringify([{ name: "হেড ম্যাসাজ", price: 300, durationMins: 20 }]),
      totalAmount: 300,
      totalDuration: 20,
      status: "WAITING",
    },
  });

  // 8. Financial Ledger Entries (Sales & Expenses for Salon 1)
  const pastDates = [
    { date: todayStr, type: "INCOME", category: "সার্ভিস বিল (Service)", amount: 1250, note: "আজকের ক্যাশ ও অনলাইন সেল" },
    { date: todayStr, type: "EXPENSE", category: "দোকানের খরচ (Utility/Tea)", amount: 180, note: "স্টাফ চা ও নাস্তা" },
    { date: todayStr, type: "EXPENSE", category: "কসমেটিকস ক্রয় (Supplies)", amount: 650, note: "শেভিং ক্রিম ও ব্লেড প্যাক" },
    { date: "2026-10-15", type: "INCOME", category: "সার্ভিস বিল", amount: 3400, note: "১৪ জন কাস্টমারের সার্ভিস" },
    { date: "2026-10-15", type: "EXPENSE", category: "বিদ্যুৎ বিল (Electricity)", amount: 1500, note: "মাসিক প্রি-পেইড মিটার রিচার্জ" },
    { date: "2026-10-14", type: "INCOME", category: "সার্ভিস বিল", amount: 2850, note: "১১ জন কাস্টমার" },
    { date: "2026-10-13", type: "INCOME", category: "সার্ভিস বিল", amount: 4100, note: "শুক্রবার স্পেশাল ভিড়" },
    { date: "2026-10-13", type: "EXPENSE", category: "কর্মচারী বেতন (Staff)", amount: 1000, note: "সহকারী কারিগরের সাপ্তাহিক বকশিস" },
    { date: "2026-10-10", type: "EXPENSE", category: "দোকান ভাড়া (Rent)", amount: 8000, note: "অক্টোবর মাসের অগ্রিম ভাড়া" },
  ];

  for (const entry of pastDates) {
    await prisma.ledgerEntry.create({
      data: {
        saloonId: salon1.id,
        type: entry.type as any,
        category: entry.category,
        amount: entry.amount,
        note: entry.note,
        entryDate: entry.date,
      },
    });
  }

  // 9. Subscriptions
  // Pending MFS TrxID for Salon 3
  await prisma.subscription.create({
    data: {
      saloonId: salon3.id,
      planType: "MONTHLY",
      amount: 499,
      paymentMethod: "BKASH",
      senderNumber: "01822334455",
      trxId: "BKASH9928371X",
      status: "PENDING",
      adminNote: "বিকাশ অ্যাপ থেকে পাঠানো হয়েছে, যাচাই করুন",
    },
  });

  // Approved Subscription for Salon 1
  await prisma.subscription.create({
    data: {
      saloonId: salon1.id,
      planType: "YEARLY",
      amount: 4999,
      paymentMethod: "NAGAD",
      senderNumber: "01711223344",
      trxId: "NAGAD88761234",
      status: "APPROVED",
      validUntil: subEnds,
      adminNote: "Payment verified successfully",
    },
  });

  console.log("Database seeded successfully with realistic Bangladesh salon data!");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
