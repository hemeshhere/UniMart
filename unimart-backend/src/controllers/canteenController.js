const Canteen = require('../models/Canteen');

// @desc    Get all canteens (with dynamic filtering for the Buyer)
// @route   GET /api/canteens
// @access  Private
exports.getAllCanteens = async (req, res) => {
  try {
    const { search, location, isOpen } = req.query;
    
    // 1. Initialize an empty query object
    let queryObj = {};

    // 2. Text Search: Case-insensitive regex matching for Canteen Name
    if (search) {
      queryObj.name = { $regex: search, $options: 'i' };
    }

    // 3. Exact Match Filter: Location
    if (location) {
      queryObj.location = location;
    }
    
    // 4. Boolean Filter: Open/Closed status
    // The query string passes 'true' as a string, so we strictly parse it to a boolean
    if (isOpen !== undefined) {
      queryObj.isOpen = isOpen === 'true';
    }

    // 5. Execute the query
    // We use .select('-menu') to completely strip the heavy nested arrays from this payload.
    const canteens = await Canteen.find(queryObj).select('-menu');

    res.status(200).json({
      success: true,
      count: canteens.length,
      data: canteens
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get a specific canteen's full menu details
// @route   GET /api/canteens/:id
// @access  Private
exports.getCanteenMenu = async (req, res) => {
  try {
    const canteenId = req.params.id;
    
    // 1. Fetch the complete document, including all food categories and items
    const canteen = await Canteen.findById(canteenId);

    // 2. Security Check
    if (!canteen) {
      return res.status(404).json({ success: false, message: 'Canteen not found' });
    }

    res.status(200).json({
      success: true,
      data: canteen
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};