import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Bắt đầu nạp dữ liệu mẫu (Seeding Database)...");

  // 1. Tạo tài khoản mẫu (Admin, Staff, Customer) theo Mục 5 README.md
  const adminPassword = await bcrypt.hash("Admin@123456", 10);
  const staffPassword = await bcrypt.hash("Staff@123456", 10);
  const customerPassword = await bcrypt.hash("Customer@123456", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@trendyfit.vn" },
    update: {},
    create: {
      email: "admin@trendyfit.vn",
      passwordHash: adminPassword,
      fullName: "Quản Trị Viên Hệ Thống",
      role: Role.ADMIN,
      phone: "0901234567",
    },
  });

  const staff = await prisma.user.upsert({
    where: { email: "staff@trendyfit.vn" },
    update: {},
    create: {
      email: "staff@trendyfit.vn",
      passwordHash: staffPassword,
      fullName: "Nhân Viên Vận Hành",
      role: Role.STAFF,
      phone: "0907654321",
    },
  });

  const customer = await prisma.user.upsert({
    where: { email: "customer@gmail.com" },
    update: {},
    create: {
      email: "customer@gmail.com",
      passwordHash: customerPassword,
      fullName: "Nguyễn Văn Khách Hàng",
      role: Role.CUSTOMER,
      phone: "0988888888",
    },
  });

  console.log("✅ Đã tạo tài khoản demo: Admin, Staff, Customer.");

  // 2. Tạo Danh mục (Category)
  const catTop = await prisma.category.upsert({
    where: { slug: "ao-thun" },
    update: {},
    create: { name: "Áo Thun & Sơ Mi", slug: "ao-thun" },
  });

  const catBottom = await prisma.category.upsert({
    where: { slug: "quan-jean" },
    update: {},
    create: { name: "Quần Jean & Kaki", slug: "quan-jean" },
  });

  const catOuter = await prisma.category.upsert({
    where: { slug: "ao-khoac" },
    update: {},
    create: { name: "Áo Khoác", slug: "ao-khoac" },
  });

  const catShoes = await prisma.category.upsert({
    where: { slug: "giay-sneaker" },
    update: {},
    create: { name: "Giày Sneaker", slug: "giay-sneaker" },
  });

  console.log("✅ Đã tạo các danh mục sản phẩm.");

  // 3. Tạo Sản phẩm & Biến thể & SizeChart
  const prodTee = await prisma.product.upsert({
    where: { slug: "ao-thun-trendyfit-basic" },
    update: {},
    create: {
      name: "Áo Thun TrendyFit Oversize Basic",
      slug: "ao-thun-trendyfit-basic",
      description: "Chất liệu 100% cotton 2 chiều định lượng 250gsm thoáng mát, form dáng suông thoải mái.",
      basePrice: 249000,
      categoryId: catTop.id,
      variants: {
        create: [
          { sku: "TEE-BLK-S", color: "Đen", size: "S", stockQuantity: 20, imageUrl: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500" },
          { sku: "TEE-BLK-M", color: "Đen", size: "M", stockQuantity: 15, imageUrl: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500" },
          { sku: "TEE-BLK-L", color: "Đen", size: "L", stockQuantity: 10, imageUrl: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500" },
          { sku: "TEE-WHT-M", color: "Trắng", size: "M", stockQuantity: 25, imageUrl: "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=500" },
        ],
      },
      sizeCharts: {
        create: [
          { size: "S", minHeightCm: 155, maxHeightCm: 165, minWeightKg: 45, maxWeightKg: 55, chestCm: 90, waistCm: 70 },
          { size: "M", minHeightCm: 165, maxHeightCm: 172, minWeightKg: 55, maxWeightKg: 65, chestCm: 96, waistCm: 76 },
          { size: "L", minHeightCm: 170, maxHeightCm: 178, minWeightKg: 65, maxWeightKg: 75, chestCm: 102, waistCm: 82 },
          { size: "XL", minHeightCm: 175, maxHeightCm: 185, minWeightKg: 75, maxWeightKg: 85, chestCm: 108, waistCm: 88 },
        ],
      },
    },
  });

  const prodJean = await prisma.product.upsert({
    where: { slug: "quan-jean-wide-leg" },
    update: {},
    create: {
      name: "Quần Jean Ống Suông Wide-Leg Retro",
      slug: "quan-jean-wide-leg",
      description: "Chất vải denim wash xám cao cấp, form ống rộng hack dáng chuẩn phong cách đường phố.",
      basePrice: 420000,
      categoryId: catBottom.id,
      variants: {
        create: [
          { sku: "JEA-BLU-M", color: "Xanh Wash", size: "M", stockQuantity: 15, imageUrl: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=500" },
          { sku: "JEA-BLU-L", color: "Xanh Wash", size: "L", stockQuantity: 8, imageUrl: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=500" },
        ],
      },
      sizeCharts: {
        create: [
          { size: "M", minHeightCm: 165, maxHeightCm: 172, minWeightKg: 55, maxWeightKg: 65, waistCm: 76 },
          { size: "L", minHeightCm: 170, maxHeightCm: 180, minWeightKg: 65, maxWeightKg: 75, waistCm: 82 },
        ],
      },
    },
  });

  console.log("✅ Đã tạo các sản phẩm, biến thể và bảng SizeChart phục vụ Smart Fit Advisor.");

  // 4. Tạo Voucher
  await prisma.voucher.upsert({
    where: { code: "WELCOME2026" },
    update: {},
    create: {
      code: "WELCOME2026",
      discountType: "PERCENT",
      discountValue: 20,
      minOrderValue: 200000,
      usageLimit: 100,
      usedCount: 0,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 ngày
    },
  });

  await prisma.voucher.upsert({
    where: { code: "FREESHIP" },
    update: {},
    create: {
      code: "FREESHIP",
      discountType: "FIXED",
      discountValue: 30000,
      minOrderValue: 150000,
      usageLimit: 50,
      usedCount: 0,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  console.log("✅ Đã tạo các mã giảm giá Voucher.");

  console.log("🎉 Hoàn tất quá trình nạp dữ liệu mẫu!");
}

main()
  .catch((e) => {
    console.error("Lỗi khi seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
