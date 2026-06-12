const Appointment = require('../models/Appointment');
const Vehicle = require('../models/Vehicle');
const Notification = require('../models/Notification');

// @desc    Get all appointments
// @route   GET /api/appointments
// @access  Private
exports.getAppointments = async (req, res, next) => {
  try {
    let query;
    if (req.user.role === 'admin') {
      query = Appointment.find()
        .populate('user', 'name email')
        .populate('vehicle', 'registrationNumber manufacturer model');
    } else {
      query = Appointment.find({ user: req.user._id })
        .populate('vehicle', 'registrationNumber manufacturer model');
    }

    const appointments = await query.sort({ appointmentDate: 1 });

    res.json({
      success: true,
      count: appointments.length,
      appointments,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single appointment details
// @route   GET /api/appointments/:id
// @access  Private
exports.getAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('user', 'name email')
      .populate('vehicle', 'registrationNumber manufacturer model');

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    // Verify ownership or admin
    if (appointment.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to view this appointment' });
    }

    res.json({
      success: true,
      appointment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Book a new appointment
// @route   POST /api/appointments
// @access  Private
exports.bookAppointment = async (req, res, next) => {
  try {
    const { vehicle: vehicleId, serviceCategory, appointmentDate, notes } = req.body;

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    // Verify ownership
    if (vehicle.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to book appointments for this vehicle' });
    }

    const parsedDate = new Date(appointmentDate);
    if (parsedDate < new Date()) {
      return res.status(400).json({ success: false, message: 'Appointment date must be in the future' });
    }

    const appointment = await Appointment.create({
      user: req.user._id,
      vehicle: vehicleId,
      serviceCategory,
      appointmentDate: parsedDate,
      notes,
      status: 'Pending',
    });

    // Create system notification for admin or confirmation for user
    await Notification.create({
      user: req.user._id,
      vehicle: vehicleId,
      type: 'System Notification',
      title: 'Appointment Booked',
      message: `Your appointment for ${serviceCategory} on ${parsedDate.toLocaleDateString()} has been requested.`,
      link: '/appointments',
    });

    res.status(201).json({
      success: true,
      appointment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reschedule appointment
// @route   PUT /api/appointments/:id/reschedule
// @access  Private
exports.rescheduleAppointment = async (req, res, next) => {
  try {
    const { appointmentDate, notes } = req.body;

    let appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    // Verify ownership
    if (appointment.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to reschedule this appointment' });
    }

    const parsedDate = new Date(appointmentDate);
    if (parsedDate < new Date()) {
      return res.status(400).json({ success: false, message: 'Rescheduled date must be in the future' });
    }

    appointment.appointmentDate = parsedDate;
    if (notes !== undefined) {
      appointment.notes = notes;
    }
    appointment.status = 'Pending'; // Reset to pending if rescheduled by user

    await appointment.save();

    await Notification.create({
      user: appointment.user,
      vehicle: appointment.vehicle,
      type: 'Appointment Reminder',
      title: 'Appointment Rescheduled',
      message: `Your appointment has been successfully rescheduled to ${parsedDate.toLocaleString()}.`,
      link: '/appointments',
    });

    res.json({
      success: true,
      appointment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel appointment
// @route   PUT /api/appointments/:id/cancel
// @access  Private
exports.cancelAppointment = async (req, res, next) => {
  try {
    let appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    // Verify ownership
    if (appointment.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this appointment' });
    }

    appointment.status = 'Cancelled';
    await appointment.save();

    await Notification.create({
      user: appointment.user,
      vehicle: appointment.vehicle,
      type: 'System Notification',
      title: 'Appointment Cancelled',
      message: `Your appointment on ${new Date(appointment.appointmentDate).toLocaleDateString()} was cancelled.`,
      link: '/appointments',
    });

    res.json({
      success: true,
      appointment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update appointment status (Admin only)
// @route   PUT /api/appointments/:id/status
// @access  Private/Admin
exports.updateAppointmentStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['Pending', 'Confirmed', 'Completed', 'Cancelled'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    const appointment = await Appointment.findById(req.params.id).populate('vehicle');
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    appointment.status = status;
    await appointment.save();

    // Create notification alert for user
    let title = `Appointment ${status}`;
    let msg = `Your appointment for ${appointment.serviceCategory} has been marked as ${status.toLowerCase()}.`;

    if (status === 'Confirmed') {
      title = 'Appointment Confirmed';
      msg = `Your appointment for ${appointment.vehicle.manufacturer} ${appointment.vehicle.model} on ${new Date(appointment.appointmentDate).toLocaleString()} is confirmed!`;
    } else if (status === 'Completed') {
      title = 'Service Appointment Completed';
      msg = `Your scheduled service for ${appointment.serviceCategory} has been completed successfully.`;
    }

    await Notification.create({
      user: appointment.user,
      vehicle: appointment.vehicle._id,
      type: 'Appointment Reminder',
      title,
      message: msg,
      link: '/appointments',
    });

    res.json({
      success: true,
      appointment,
    });
  } catch (error) {
    next(error);
  }
};
