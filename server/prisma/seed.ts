import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Bắt đầu nạp dữ liệu mẫu hoàn chỉnh (Seeding Database)...");

  // 1. Tạo tài khoản mẫu (Admin, Staff, Customer)
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

  // 2. Tạo đầy đủ 5 Danh mục sản phẩm (Top, Bottom, Outerwear, Shoes, Accessory)
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
    create: { name: "Áo Khoác & Blazer", slug: "ao-khoac" },
  });

  const catShoes = await prisma.category.upsert({
    where: { slug: "giay-sneaker" },
    update: {},
    create: { name: "Giày Sneaker", slug: "giay-sneaker" },
  });

  const catAccessory = await prisma.category.upsert({
    where: { slug: "phu-kien" },
    update: {},
    create: { name: "Phụ Kiện Thời Trang", slug: "phu-kien" },
  });

  console.log("✅ Đã tạo đầy đủ 5 danh mục tương ứng 5 tầng phối đồ.");

  // 3. Tạo Sản phẩm & Biến thể & SizeChart

  // 3.1. Áo Thun (TOP) - Dùng ảnh studio flat product cực đẹp
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
          { sku: "TEE-BLK-S", color: "Đen", size: "S", stockQuantity: 20, imageUrl: "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=500" },
          { sku: "TEE-BLK-M", color: "Đen", size: "M", stockQuantity: 15, imageUrl: "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=500" },
          { sku: "TEE-BLK-L", color: "Đen", size: "L", stockQuantity: 10, imageUrl: "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=500" },
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

  // 3.2. Quần Jean (BOTTOM) - Dùng ảnh denim flat studio
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
          { sku: "JEA-BLK-M", color: "Đen Khói", size: "M", stockQuantity: 12, imageUrl: "https://images.unsplash.com/photo-1604176354204-9268737828e4?w=500" },
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

  // 3.3. Áo Khoác (OUTERWEAR) - Chuẩn mã AO-BLAZER-DEN-L phục vụ TC-01 & Demo
  const prodBlazer = await prisma.product.upsert({
    where: { slug: "ao-blazer-oversize-trendyfit" },
    update: {},
    create: {
      name: "Áo Blazer Form Rộng Streetwear TrendyFit",
      slug: "ao-blazer-oversize-trendyfit",
      description: "Thiết kế blazer 2 nút phom rộng phong cách Hàn Quốc, đệm vai tinh tế, chất vải tuyết mưa cao cấp.",
      basePrice: 590000,
      categoryId: catOuter.id,
      variants: {
        create: [
          { sku: "AO-BLAZER-DEN-L", color: "Đen", size: "L", stockQuantity: 1, imageUrl: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=500" },
          { sku: "AO-BLAZER-DEN-M", color: "Đen", size: "M", stockQuantity: 5, imageUrl: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=500" },
        ],
      },
      sizeCharts: {
        create: [
          { size: "M", minHeightCm: 165, maxHeightCm: 175, minWeightKg: 55, maxWeightKg: 68, chestCm: 104, waistCm: 84 },
          { size: "L", minHeightCm: 172, maxHeightCm: 185, minWeightKg: 68, maxWeightKg: 82, chestCm: 112, waistCm: 90 },
        ],
      },
    },
  });

  // 3.4. Giày Sneaker (SHOES)
  const prodSneaker = await prisma.product.upsert({
    where: { slug: "giay-sneaker-chunky-street" },
    update: {},
    create: {
      name: "Giày Sneaker Cổ Thấp TrendyFit Chunky Street",
      slug: "giay-sneaker-chunky-street",
      description: "Đế cao su lưu hóa êm ái tôn dáng 4cm, chất da PU vi sợi chống nhăn, phong cách thể thao đường phố.",
      basePrice: 650000,
      categoryId: catShoes.id,
      variants: {
        create: [
          { sku: "SNK-WHT-41", color: "Trắng", size: "41", stockQuantity: 10, imageUrl: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=500" },
          { sku: "SNK-WHT-42", color: "Trắng", size: "42", stockQuantity: 12, imageUrl: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=500" },
        ],
      },
      sizeCharts: {
        create: [
          { size: "41", minHeightCm: 165, maxHeightCm: 175, minWeightKg: 55, maxWeightKg: 75 },
          { size: "42", minHeightCm: 170, maxHeightCm: 185, minWeightKg: 60, maxWeightKg: 85 },
        ],
      },
    },
  });

  // 3.5. Phụ Kiện (ACCESSORY) - Mũ Lưỡi Trai & Kính Mát
  const prodCap = await prisma.product.upsert({
    where: { slug: "mu-luoi-trai-washed-vintage" },
    update: {},
    create: {
      name: "Mũ Lưỡi Trai TrendyFit Washed Vintage",
      slug: "mu-luoi-trai-washed-vintage",
      description: "Vải kaki 100% cotton xử lý wash bạc màu phong cách vintage, khóa kim loại cao cấp tùy chỉnh kích cỡ.",
      basePrice: 149000,
      categoryId: catAccessory.id,
      variants: {
        create: [
          { sku: "CAP-BLK-OS", color: "Đen Vintage", size: "FreeSize", stockQuantity: 30, imageUrl: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=500" },
        ],
      },
    },
  });

  const prodGlasses = await prisma.product.upsert({
    where: { slug: "kinh-mat-retro-rectangle" },
    update: {},
    create: {
      name: "Kính Mát Chữ Nhật Retro Black Sunglasses",
      slug: "kinh-mat-retro-rectangle",
      description: "Gọng kính acetate đen bóng phom chữ nhật cá tính, tròng chống tia UV400 bảo vệ mắt tối đa.",
      basePrice: 189000,
      categoryId: catAccessory.id,
      variants: {
        create: [
          { sku: "GLS-BLK-OS", color: "Đen", size: "FreeSize", stockQuantity: 25, imageUrl: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=500" },
        ],
      },
    },
  });

  console.log("✅ Đã tạo đầy đủ các sản phẩm: Áo thun, Quần jean, Áo blazer, Giày sneaker, Mũ và Kính mát.");

  // 4. Tạo Lookbook Outfits mẫu phối sẵn
  const variantBlazer = await prisma.productVariant.findFirst({ where: { sku: "AO-BLAZER-DEN-L" } });
  const variantTee = await prisma.productVariant.findFirst({ where: { sku: "TEE-BLK-M" } });
  const variantJean = await prisma.productVariant.findFirst({ where: { sku: "JEA-BLU-M" } });
  const variantSneaker = await prisma.productVariant.findFirst({ where: { sku: "SNK-WHT-41" } });
  const variantCap = await prisma.productVariant.findFirst({ where: { sku: "CAP-BLK-OS" } });

  // Xóa outfit cũ nếu có để seed mới sạch sẽ
  await prisma.outfitItem.deleteMany({});
  await prisma.outfit.deleteMany({});

  if (variantBlazer && variantTee && variantJean && variantSneaker) {
    const outfit1 = await prisma.outfit.create({
      data: {
        title: "Streetwear All-Black Layering",
        description: "Set đồ phong cách đường phố phối layer thời thượng giữa áo Blazer rộng, Áo thun cotton và Quần jean suông.",
        bannerUrl: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800",
        discountRate: 0.15,
        isActive: true,
        items: {
          create: [
            { variantId: variantBlazer.id, slotType: "OUTERWEAR" },
            { variantId: variantTee.id, slotType: "TOP" },
            { variantId: variantJean.id, slotType: "BOTTOM" },
            { variantId: variantSneaker.id, slotType: "SHOES" },
          ],
        },
      },
    });

    if (variantCap) {
      const outfit2 = await prisma.outfit.create({
        data: {
          title: "Retro Casual Daily Weekend",
          description: "Phong cách năng động trẻ trung dạo phố cuối tuần kết hợp Mũ lưỡi trai, Áo thun basic và Quần denim retro.",
          bannerUrl: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800",
          discountRate: 0.10,
          isActive: true,
          items: {
            create: [
              { variantId: variantCap.id, slotType: "ACCESSORY" },
              { variantId: variantTee.id, slotType: "TOP" },
              { variantId: variantJean.id, slotType: "BOTTOM" },
              { variantId: variantSneaker.id, slotType: "SHOES" },
            ],
          },
        },
      });
    }
    console.log("✅ Đã tạo các bộ phối mẫu Lookbook Presets (giảm combo 10% - 15%).");
  }

  // 5. Tạo Voucher
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
