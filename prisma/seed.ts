import { PrismaClient } from "@prisma/client";
import { auth } from "../src/lib/auth";

const prisma = new PrismaClient();

// ── Helper ────────────────────────────────────────────────────────────────────
function months(n: number) {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d;
}

async function createUser(data: {
  name: string; email: string; password: string;
  role: string; image?: string; bio?: string; phone?: string;
}) {
  const ctx = await auth.api.signUpEmail({
    body: { name: data.name, email: data.email, password: data.password, role: data.role },
  });
  const userId = (ctx as any).user?.id;
  if (!userId) throw new Error(`Failed to create user: ${data.email}`);

  await prisma.user.update({
    where: { id: userId },
    data: {
      role: data.role as any,
      status: "ACTIVE",
      bio: data.bio,
      phone: data.phone,
      nidVerified: true,
      emailVerified: true,
      image: data.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.name}`,
    },
  });

  await prisma.wallet.create({ data: { userId, balance: 500000, totalInvested: 0, totalEarned: 0 } });
  return userId;
}

// ── Main Seed ─────────────────────────────────────────────────────────────────
async function main() {
  console.log("🌱 Seeding NoorVenture database...");

  // ── Users ──────────────────────────────────────────────────────────────────
  const adminId = await createUser({
    name: "Noor Admin",
    email: "admin@noorventure.com",
    password: "Admin1234!",
    role: "ADMIN",
    bio: "Platform administrator",
  });
  await prisma.user.update({ where: { id: adminId }, data: { role: "ADMIN" } });

  const owner1 = await createUser({
    name: "Rafsan Ahmed",
    email: "rafsan@noorventure.com",
    password: "Owner1234!",
    role: "BUSINESS_OWNER",
    bio: "Tech entrepreneur from Dhaka with 5 years experience in SaaS",
    phone: "01711000001",
  });

  const owner2 = await createUser({
    name: "Sultana Begum",
    email: "sultana@noorventure.com",
    password: "Owner1234!",
    role: "BUSINESS_OWNER",
    bio: "Restaurant owner and food industry expert",
    phone: "01711000002",
  });

  const owner3 = await createUser({
    name: "Karim Hossain",
    email: "karim@noorventure.com",
    password: "Owner1234!",
    role: "BUSINESS_OWNER",
    bio: "Healthcare professional and clinic operator",
    phone: "01711000003",
  });

  const owner4 = await createUser({
    name: "Farida Khanam",
    email: "farida@noorventure.com",
    password: "Owner1234!",
    role: "BUSINESS_OWNER",
    bio: "Agricultural entrepreneur and farming cooperative founder",
    phone: "01711000004",
  });

  const inv1 = await createUser({ name: "Abdullah Rahman", email: "investor1@noorventure.com", password: "Invest1234!", role: "INVESTOR", bio: "Angel investor focused on tech and healthcare" });
  const inv2 = await createUser({ name: "Sadia Islam",     email: "investor2@noorventure.com", password: "Invest1234!", role: "INVESTOR", bio: "Impact investor supporting halal businesses" });
  const inv3 = await createUser({ name: "Tariq Mahmud",    email: "investor3@noorventure.com", password: "Invest1234!", role: "INVESTOR", bio: "Retired banker investing in SMBs" });
  const inv4 = await createUser({ name: "Nusrat Jahan",    email: "investor4@noorventure.com", password: "Invest1234!", role: "INVESTOR", bio: "Young professional building a halal portfolio" });
  const inv5 = await createUser({ name: "Jalal Uddin",     email: "investor5@noorventure.com", password: "Invest1234!", role: "INVESTOR", bio: "Businessman diversifying into startup investments" });

  console.log("✅ Users created");

  // ── Proposals ─────────────────────────────────────────────────────────────
  const proposals = await Promise.all([
    prisma.proposal.create({ data: {
      title: "TechHub BD — B2B SaaS Platform for SMEs",
      slug: "techub-bd-b2b-saas-platform",
      description: "TechHub BD is a comprehensive SaaS platform designed for small and medium enterprises in Bangladesh. We provide inventory management, billing, HR, and analytics tools in a single affordable subscription. With 200+ beta users already on board, we are now seeking funding to scale our engineering team and expand to 10 cities within 12 months. Our platform has demonstrated a 40% reduction in operational costs for beta users.",
      businessType: "SaaS / Technology",
      category: "Technology",
      location: "Dhaka",
      fundingGoal: 500000,
      minimumInvestment: 10000,
      profitSharePercent: 35,
      ownerSharePercent: 65,
      duration: 24,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: "FUNDED",
      riskLevel: "MEDIUM",
      amountRaised: 500000,
      totalInvestors: 3,
      expectedReturn: 28,
      aiScore: 78,
      aiTags: ["saas", "technology", "b2b", "smb", "dhaka"],
      images: ["https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800"],
      ownerId: owner1,
      createdAt: months(5),
    }}),
    prisma.proposal.create({ data: {
      title: "Spice Garden — Authentic Bengali Restaurant Chain",
      slug: "spice-garden-bengali-restaurant-chain",
      description: "Spice Garden brings authentic home-style Bengali cuisine to the urban professional market. Our first outlet in Gulshan generated ৳8,00,000 in revenue within 6 months. With this funding round, we will open 3 new outlets in Banani, Dhanmondi, and Mirpur. All ingredients are sourced directly from farmers ensuring freshness and fair trade. We use a cloud kitchen model for delivery orders to maximize efficiency.",
      businessType: "Food & Beverage",
      category: "Restaurant",
      location: "Dhaka",
      fundingGoal: 300000,
      minimumInvestment: 5000,
      profitSharePercent: 30,
      ownerSharePercent: 70,
      duration: 18,
      deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      status: "ACTIVE",
      riskLevel: "LOW",
      amountRaised: 225000,
      totalInvestors: 4,
      expectedReturn: 22,
      aiScore: 82,
      aiTags: ["restaurant", "food", "bengali", "dhaka", "chain"],
      images: ["https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800"],
      ownerId: owner2,
      createdAt: months(4),
    }}),
    prisma.proposal.create({ data: {
      title: "MediPoint — Affordable Diagnostic Clinic Network",
      slug: "medipoint-affordable-diagnostic-clinic",
      description: "MediPoint addresses the critical gap in affordable diagnostic services in Bangladesh. Our first clinic in Mohammadpur serves 150+ patients daily at 60% lower cost than private hospitals. We use technology to streamline operations — digital patient records, automated billing, and telemedicine consultations. With this investment, we will open 2 additional clinics and add advanced diagnostic equipment including MRI and CT scan services.",
      businessType: "Healthcare / Medical",
      category: "Healthcare",
      location: "Dhaka",
      fundingGoal: 800000,
      minimumInvestment: 20000,
      profitSharePercent: 40,
      ownerSharePercent: 60,
      duration: 36,
      deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      status: "ACTIVE",
      riskLevel: "LOW",
      amountRaised: 480000,
      totalInvestors: 3,
      expectedReturn: 32,
      aiScore: 85,
      aiTags: ["healthcare", "clinic", "diagnostic", "affordable", "medical"],
      images: ["https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800"],
      ownerId: owner3,
      createdAt: months(3),
    }}),
    prisma.proposal.create({ data: {
      title: "AgroFresh — Direct Farm-to-Table Supply Chain",
      slug: "agrofresh-farm-to-table-supply-chain",
      description: "AgroFresh connects 500+ farmers in Rajshahi, Rangpur, and Mymensingh directly with restaurants, hotels, and consumers in Dhaka. We eliminate 4 middlemen layers, giving farmers 35% higher prices and buyers 25% lower costs. Our cold storage and logistics network ensures freshness. We currently process 5 tonnes of produce daily and aim to reach 20 tonnes with this investment round.",
      businessType: "Agriculture / Supply Chain",
      category: "Agriculture",
      location: "Rajshahi",
      fundingGoal: 200000,
      minimumInvestment: 5000,
      profitSharePercent: 32,
      ownerSharePercent: 68,
      duration: 12,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: "APPROVED",
      riskLevel: "MEDIUM",
      amountRaised: 60000,
      totalInvestors: 2,
      expectedReturn: 25,
      aiScore: 74,
      aiTags: ["agriculture", "farming", "supply-chain", "fresh", "rajshahi"],
      images: ["https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800"],
      ownerId: owner4,
      createdAt: months(2),
    }}),
    prisma.proposal.create({ data: {
      title: "EduSpark — Vernacular STEM Education Platform",
      slug: "eduspark-vernacular-stem-education",
      description: "EduSpark delivers STEM education in Bangla for students in grades 6–12 across Bangladesh. Our gamified platform has 15,000 active students in 6 months with 85% retention rate. We partner with 200 schools in rural areas where quality STEM teachers are scarce. Revenue comes from school subscriptions (৳2,000/month) and premium student accounts. With this funding, we will add AI-powered personalized learning paths.",
      businessType: "EdTech / Education",
      category: "Education",
      location: "Dhaka",
      fundingGoal: 400000,
      minimumInvestment: 10000,
      profitSharePercent: 38,
      ownerSharePercent: 62,
      duration: 24,
      deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      status: "APPROVED",
      riskLevel: "MEDIUM",
      amountRaised: 180000,
      totalInvestors: 2,
      expectedReturn: 30,
      aiScore: 80,
      aiTags: ["education", "edtech", "stem", "bangla", "school"],
      images: ["https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800"],
      ownerId: owner1,
      createdAt: months(2),
    }}),
    prisma.proposal.create({ data: {
      title: "FoodBridge — Ghost Kitchen & Delivery Service",
      slug: "foodbridge-ghost-kitchen-delivery",
      description: "FoodBridge operates 5 ghost kitchen brands from a single facility in Uttara, serving over 300 orders daily through Pathao Food, Shohoz, and our own app. This investment funded expansion to Mirpur. The project has been successfully completed with investors receiving full returns plus profit sharing.",
      businessType: "Food Delivery / Ghost Kitchen",
      category: "Restaurant",
      location: "Dhaka",
      fundingGoal: 250000,
      minimumInvestment: 5000,
      profitSharePercent: 30,
      ownerSharePercent: 70,
      duration: 12,
      deadline: months(1),
      status: "COMPLETED",
      riskLevel: "LOW",
      amountRaised: 250000,
      totalInvestors: 4,
      expectedReturn: 24,
      aiScore: 88,
      aiTags: ["food", "ghost-kitchen", "delivery", "dhaka", "completed"],
      images: ["https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800"],
      ownerId: owner2,
      createdAt: months(14),
    }}),
    prisma.proposal.create({ data: {
      title: "GreenEnergy BD — Solar Panel Installation Network",
      slug: "greenenergy-bd-solar-installation",
      description: "GreenEnergy BD provides affordable solar energy solutions for homes and SMEs across Bangladesh. We offer zero-down installment plans making solar accessible to middle-income families. Our service model includes installation, maintenance, and monitoring. We have completed 150 installations in Gazipur and Narsingdi. This funding will expand our installer network to 8 new districts and launch commercial-scale installations.",
      businessType: "Renewable Energy",
      category: "Energy",
      location: "Gazipur",
      fundingGoal: 1000000,
      minimumInvestment: 25000,
      profitSharePercent: 35,
      ownerSharePercent: 65,
      duration: 36,
      deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      status: "PENDING",
      riskLevel: "MEDIUM",
      amountRaised: 0,
      totalInvestors: 0,
      expectedReturn: 28,
      aiTags: [],
      images: ["https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800"],
      ownerId: owner3,
      createdAt: months(0),
    }}),
    prisma.proposal.create({ data: {
      title: "CloudKitchen BD — Multi-Brand Food Court",
      slug: "cloudkitchen-bd-multi-brand-food-court",
      description: "CloudKitchen BD operates a next-generation food court concept where 8 different food brands share one premium space in Bashundhara City. Each brand has its own identity and menu, operated by our trained team. The concept combines the variety of a food court with the quality control of a restaurant. Currently at 90% of funding goal, the kitchen is under final setup.",
      businessType: "Food & Beverage",
      category: "Restaurant",
      location: "Dhaka",
      fundingGoal: 180000,
      minimumInvestment: 5000,
      profitSharePercent: 35,
      ownerSharePercent: 65,
      duration: 18,
      deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      status: "APPROVED",
      riskLevel: "MEDIUM",
      amountRaised: 162000,
      totalInvestors: 3,
      expectedReturn: 26,
      aiScore: 76,
      aiTags: ["food", "cloud-kitchen", "multi-brand", "dhaka", "mall"],
      images: ["https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800"],
      ownerId: owner2,
      createdAt: months(1),
    }}),
    prisma.proposal.create({ data: {
      title: "WaterPure — Community Water Purification Plants",
      slug: "waterpure-community-purification-plants",
      description: "WaterPure installs and operates community water purification plants in underserved areas. Each plant serves 500 families with safe drinking water at ৳5 per 20L — 80% cheaper than bottled water. We have 8 operational plants across Narayanganj and Munshiganj. This round is fully funded and the project is now in active operation with monthly profit distributions to investors.",
      businessType: "Water & Sanitation",
      category: "Social Enterprise",
      location: "Narayanganj",
      fundingGoal: 350000,
      minimumInvestment: 10000,
      profitSharePercent: 40,
      ownerSharePercent: 60,
      duration: 24,
      deadline: months(2),
      status: "ACTIVE",
      riskLevel: "LOW",
      amountRaised: 350000,
      totalInvestors: 4,
      expectedReturn: 30,
      aiScore: 90,
      aiTags: ["water", "social-enterprise", "community", "narayanganj", "impact"],
      images: ["https://images.unsplash.com/photo-1559825481-12a05cc00344?w=800"],
      ownerId: owner4,
      createdAt: months(8),
    }}),
    prisma.proposal.create({ data: {
      title: "RetailPro — Smart Inventory SaaS for Retailers",
      slug: "retailpro-smart-inventory-saas",
      description: "RetailPro is a mobile-first inventory management app for small retailers, shop owners, and wholesalers. Features include barcode scanning, low-stock alerts, supplier management, and daily profit reports. Currently 800 paying users at ৳299/month. We are seeking investment to build a WhatsApp integration for order management and expand our sales team.",
      businessType: "SaaS / Retail Technology",
      category: "Technology",
      location: "Chittagong",
      fundingGoal: 600000,
      minimumInvestment: 15000,
      profitSharePercent: 33,
      ownerSharePercent: 67,
      duration: 30,
      deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      status: "APPROVED",
      riskLevel: "MEDIUM",
      amountRaised: 120000,
      totalInvestors: 1,
      expectedReturn: 26,
      aiScore: 72,
      aiTags: ["saas", "retail", "inventory", "mobile", "chittagong"],
      images: ["https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800"],
      ownerId: owner1,
      createdAt: months(1),
    }}),
  ]);

  console.log("✅ Proposals created");

  const [techHub, spiceGarden, mediPoint, , , foodBridge, , , waterPure] = proposals;

  // ── Investments ───────────────────────────────────────────────────────────
  const investmentData = [
    { investorId: inv1, proposalId: techHub.id, amount: 200000, profitEarned: 24000, sharePercent: 14 },
    { investorId: inv2, proposalId: techHub.id, amount: 150000, profitEarned: 18000, sharePercent: 10.5 },
    { investorId: inv3, proposalId: techHub.id, amount: 150000, profitEarned: 18000, sharePercent: 10.5 },
    { investorId: inv1, proposalId: spiceGarden.id, amount: 75000, profitEarned: 8000, sharePercent: 7.5 },
    { investorId: inv4, proposalId: spiceGarden.id, amount: 75000, profitEarned: 8000, sharePercent: 7.5 },
    { investorId: inv2, proposalId: spiceGarden.id, amount: 50000, profitEarned: 5200, sharePercent: 5 },
    { investorId: inv5, proposalId: spiceGarden.id, amount: 25000, profitEarned: 2500, sharePercent: 2.5 },
    { investorId: inv3, proposalId: mediPoint.id, amount: 200000, profitEarned: 15000, sharePercent: 10 },
    { investorId: inv1, proposalId: mediPoint.id, amount: 150000, profitEarned: 11250, sharePercent: 7.5 },
    { investorId: inv5, proposalId: mediPoint.id, amount: 130000, profitEarned: 9750, sharePercent: 6.5 },
    { investorId: inv2, proposalId: foodBridge.id, amount: 80000, profitEarned: 12000, sharePercent: 9.6, status: "COMPLETED" },
    { investorId: inv3, proposalId: foodBridge.id, amount: 70000, profitEarned: 10500, sharePercent: 8.4, status: "COMPLETED" },
    { investorId: inv4, proposalId: foodBridge.id, amount: 60000, profitEarned: 9000, sharePercent: 7.2, status: "COMPLETED" },
    { investorId: inv5, proposalId: foodBridge.id, amount: 40000, profitEarned: 6000, sharePercent: 4.8, status: "COMPLETED" },
    { investorId: inv1, proposalId: waterPure.id, amount: 100000, profitEarned: 18000, sharePercent: 11.4 },
    { investorId: inv2, proposalId: waterPure.id, amount: 100000, profitEarned: 18000, sharePercent: 11.4 },
    { investorId: inv4, proposalId: waterPure.id, amount: 80000, profitEarned: 14400, sharePercent: 9.1 },
    { investorId: inv5, proposalId: waterPure.id, amount: 70000, profitEarned: 12600, sharePercent: 8 },
  ];

  for (const inv of investmentData) {
    await prisma.investment.create({
      data: {
        investorId: inv.investorId,
        proposalId: inv.proposalId,
        amount: inv.amount,
        profitEarned: inv.profitEarned,
        sharePercent: inv.sharePercent,
        status: (inv.status || "ACTIVE") as any,
        createdAt: months(Math.floor(Math.random() * 4) + 1),
      },
    });

    // Add investment transaction to investor wallet
    const wallet = await prisma.wallet.findUnique({ where: { userId: inv.investorId } });
    if (wallet) {
      await prisma.transaction.create({
        data: {
          walletId: wallet.id,
          type: "INVESTMENT",
          amount: inv.amount,
          description: `Invested in ${proposals.find((p) => p.id === inv.proposalId)?.title}`,
          createdAt: months(Math.floor(Math.random() * 4) + 1),
        },
      });
      if (inv.profitEarned > 0) {
        await prisma.transaction.create({
          data: {
            walletId: wallet.id,
            type: "PROFIT",
            amount: inv.profitEarned,
            description: "Profit distribution",
            createdAt: months(1),
          },
        });
      }
      await prisma.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: { decrement: inv.amount - inv.profitEarned },
          totalInvested: { increment: inv.amount },
          totalEarned: { increment: inv.profitEarned },
        },
      });
    }
  }

  console.log("✅ Investments created");

  // ── Profit Reports ─────────────────────────────────────────────────────────
  const reportData = [
    // TechHub — 5 months
    { proposalId: techHub.id, userId: owner1, month: 1, year: 2025, revenue: 180000, expenses: 95000, netProfit: 85000, investorShare: 29750 },
    { proposalId: techHub.id, userId: owner1, month: 2, year: 2025, revenue: 210000, expenses: 100000, netProfit: 110000, investorShare: 38500 },
    { proposalId: techHub.id, userId: owner1, month: 3, year: 2025, revenue: 245000, expenses: 108000, netProfit: 137000, investorShare: 47950 },
    { proposalId: techHub.id, userId: owner1, month: 4, year: 2025, revenue: 280000, expenses: 115000, netProfit: 165000, investorShare: 57750 },
    { proposalId: techHub.id, userId: owner1, month: 5, year: 2025, revenue: 320000, expenses: 120000, netProfit: 200000, investorShare: 70000 },
    // Spice Garden — 4 months
    { proposalId: spiceGarden.id, userId: owner2, month: 2, year: 2025, revenue: 95000, expenses: 55000, netProfit: 40000, investorShare: 12000 },
    { proposalId: spiceGarden.id, userId: owner2, month: 3, year: 2025, revenue: 110000, expenses: 60000, netProfit: 50000, investorShare: 15000 },
    { proposalId: spiceGarden.id, userId: owner2, month: 4, year: 2025, revenue: 130000, expenses: 65000, netProfit: 65000, investorShare: 19500 },
    { proposalId: spiceGarden.id, userId: owner2, month: 5, year: 2025, revenue: 145000, expenses: 68000, netProfit: 77000, investorShare: 23100 },
    // MediPoint — 3 months
    { proposalId: mediPoint.id, userId: owner3, month: 3, year: 2025, revenue: 250000, expenses: 160000, netProfit: 90000, investorShare: 36000 },
    { proposalId: mediPoint.id, userId: owner3, month: 4, year: 2025, revenue: 290000, expenses: 170000, netProfit: 120000, investorShare: 48000 },
    { proposalId: mediPoint.id, userId: owner3, month: 5, year: 2025, revenue: 320000, expenses: 175000, netProfit: 145000, investorShare: 58000 },
    // WaterPure — 6 months
    { proposalId: waterPure.id, userId: owner4, month: 12, year: 2024, revenue: 60000, expenses: 28000, netProfit: 32000, investorShare: 12800 },
    { proposalId: waterPure.id, userId: owner4, month: 1, year: 2025, revenue: 65000, expenses: 29000, netProfit: 36000, investorShare: 14400 },
    { proposalId: waterPure.id, userId: owner4, month: 2, year: 2025, revenue: 70000, expenses: 30000, netProfit: 40000, investorShare: 16000 },
    { proposalId: waterPure.id, userId: owner4, month: 3, year: 2025, revenue: 72000, expenses: 30500, netProfit: 41500, investorShare: 16600 },
    { proposalId: waterPure.id, userId: owner4, month: 4, year: 2025, revenue: 78000, expenses: 31000, netProfit: 47000, investorShare: 18800 },
    { proposalId: waterPure.id, userId: owner4, month: 5, year: 2025, revenue: 85000, expenses: 32000, netProfit: 53000, investorShare: 21200 },
  ];

  for (const r of reportData) {
    await prisma.profitReport.create({
      data: {
        proposalId: r.proposalId,
        submittedById: r.userId,
        month: r.month,
        year: r.year,
        revenue: r.revenue,
        expenses: r.expenses,
        netProfit: r.netProfit,
        investorShare: r.investorShare,
        notes: "Monthly operations report submitted on time.",
      },
    });
  }

  console.log("✅ Profit reports created");

  // ── Milestones ─────────────────────────────────────────────────────────────
  await prisma.milestone.createMany({
    data: [
      { proposalId: techHub.id, title: "MVP Launch", description: "Launch core product features", dueDate: months(4), status: "COMPLETED", completedAt: months(4) },
      { proposalId: techHub.id, title: "100 Paying Customers", description: "Reach 100 paying SME customers", dueDate: months(2), status: "COMPLETED", completedAt: months(3) },
      { proposalId: techHub.id, title: "Series A Preparation", description: "Prepare documentation for Series A round", dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), status: "IN_PROGRESS" },
      { proposalId: spiceGarden.id, title: "Gulshan Outlet", description: "Open Gulshan flagship outlet", dueDate: months(3), status: "COMPLETED", completedAt: months(3) },
      { proposalId: spiceGarden.id, title: "Banani Outlet", description: "Open 2nd outlet in Banani", dueDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), status: "IN_PROGRESS" },
      { proposalId: mediPoint.id, title: "Mohammadpur Clinic", description: "First clinic fully operational", dueDate: months(2), status: "COMPLETED", completedAt: months(2) },
      { proposalId: mediPoint.id, title: "MRI Equipment", description: "Install MRI equipment at main clinic", dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), status: "PENDING" },
      { proposalId: waterPure.id, title: "8 Plants Operational", description: "All 8 water plants fully operational", dueDate: months(5), status: "COMPLETED", completedAt: months(5) },
      { proposalId: waterPure.id, title: "10,000 Families Served", description: "Reach 10,000 family milestone", dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), status: "IN_PROGRESS" },
    ],
  });

  console.log("✅ Milestones created");
  console.log("\n🎉 Seeding complete! Demo credentials:");
  console.log("   Admin:    admin@noorventure.com    / Admin1234!");
  console.log("   Owner:    rafsan@noorventure.com   / Owner1234!");
  console.log("   Investor: investor1@noorventure.com / Invest1234!");
}

main()
  .catch((e) => { console.error("❌ Seed failed:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
