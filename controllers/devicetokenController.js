const DeviceToken = require('../models/devicetokenModel');
const createError = require('../middleware/error');
const createSuccess = require('../middleware/success');

const createDeviceToken = async (req, res, next) => {
  try {
    const { employeeId, token } = req.body;

    if (!employeeId || !token) {
      return next(createError(400, "employeeId and token are required."));
    }    

    const updatedToken = await DeviceToken.findOneAndUpdate(
      {employeeId} , 
       {token} , 
      { new: true, upsert:true}
    );

    return next(createSuccess(201, "Device Token created/updated successfully.", updatedToken));
  } catch (error) {
    console.error("Error creating/updating device token:", error);
    return next(createError(500, "Internal Server Error."));
  }
};
const getAllDeviceTokens = async (req, res, next) => {
  try {
    const deviceTokens = await DeviceToken.find();
    return next(createSuccess(200, "All Device Tokens", deviceTokens));
  } catch (error) {
    console.error("Error in getAllDeviceTokens:", error);
    return next(createError(500, "Internal Server Error."));
  }
};

const getTokenByEmployeeId = async (req, res) => {
  const { employeeId } = req.params;

  try {
    const deviceToken = await DeviceToken.findOne({ employeeId });

    if (!deviceToken) {
      return res.status(404).json({ message: 'Device token not found for this user.' });
    }

    res.status(200).json({ message: 'Device token fetched successfully.', deviceToken });
  } catch (error) {
    console.error('Error fetching device token:', error);
    res.status(500).json({ message: 'Internal server error.', error });
  }
}

module.exports = {
  createDeviceToken,
  getAllDeviceTokens,
  getTokenByEmployeeId
};
