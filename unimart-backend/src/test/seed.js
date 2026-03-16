require('dotenv').config();
const mongoose = require('mongoose');
const Canteen = require('../models/Canteen');

// The exact JSON matching your schema
const sampleCanteens = [
  {
    name: "Night Canteen",
    location: "Block 41",
    isOpen: true,
    imageUrl: "https://via.placeholder.com/400x200?text=Night+Canteen",
    menu: [
      {
        categoryName: "Late Night Snacks",
        items: [
          { name: "Cheese Maggi", price: 40, isVeg: true, isAvailable: true },
          { name: "Aloo Paratha", price: 30, isVeg: true, isAvailable: true }
        ]
      },
      {
        categoryName: "Beverages",
        items: [
          { name: "Cold Coffee", price: 50, isVeg: true, isAvailable: true }
        ]
      }
    ]
  },
  {
    name: "Block 32 Cafe",
    location: "Block 32",
    isOpen: true,
    imageUrl: "https://via.placeholder.com/400x200?text=Block+32",
    menu: [
      {
        categoryName: "Fast Food",
        items: [
          { name: "Chicken Burger", price: 80, isVeg: false, isAvailable: true },
          { name: "French Fries", price: 50, isVeg: true, isAvailable: true }
        ]
      }
    ]
  }
];

const seedDB = async () => {
  try {
    // 1. Connect to your database
    await mongoose.connect(process.env.MONGO_URI);
    console.log('📦 Database Connected for Seeding...');

    // 2. Wipe out any old canteens so you don't get duplicates
    await Canteen.deleteMany();
    console.log('🧹 Old canteens wiped.');

    // 3. Inject the new data
    await Canteen.insertMany(sampleCanteens);
    console.log('✅ Test Canteens successfully injected!');

    // 4. Exit the script
    process.exit();
  } catch (error) {
    console.error('❌ Seeding Error:', error);
    process.exit(1);
  }
};

seedDB();