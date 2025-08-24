// routes/events.js
const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { cloudinary } = require('../config/cloudinary');

// Configure multer for image uploads
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'community/events',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      { width: 1200, height: 800, crop: 'limit', quality: 'auto:good' }
    ]
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 10 // Maximum 10 images per event
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Public routes
router.get('/', eventController.getEvents);
router.get('/featured', eventController.getFeaturedEvents);
router.get('/location', eventController.getEventsByLocation);
router.get('/analytics', eventController.getEventsAnalytics);
router.get('/:slug', eventController.getEvent);

// Admin routes (protected)
router.post('/', upload.array('images', 10), eventController.createEvent);
router.put('/:id', upload.array('images', 10), eventController.updateEvent);
router.delete('/:id', eventController.deleteEvent);
router.delete('/:eventId/images/:imageId', eventController.deleteEventImage);

module.exports = router;

// routes/community.js (main community routes file)
const express = require('express');
const router = express.Router();

// Import sub-routes
const videoRoutes = require('./videos');
const announcementRoutes = require('./announcements');
const eventRoutes = require('./events');

// Use sub-routes
router.use('/videos', videoRoutes);
router.use('/announcements', announcementRoutes);
router.use('/events', eventRoutes);

// Community overview/dashboard route
router.get('/dashboard', async (req, res) => {
  try {
    const Video = require('../models/Video');
    const Announcement = require('../models/Announcement');
    const Event = require('../models/Event');

    // Get latest content for dashboard
    const latestVideos = await Video.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(3)
      .select('title thumbnail views createdAt category');

    const latestAnnouncements = await Announcement.find({ isActive: true })
      .sort({ isPinned: -1, createdAt: -1 })
      .limit(5)
      .select('title excerpt priority createdAt category slug');

    const featuredEvents = await Event.find({ isActive: true, isFeatured: true })
      .sort({ eventDate: -1 })
      .limit(4)
      .select('title shortDescription eventDate location images slug views');

    // Get some statistics
    const stats = {
      totalVideos: await Video.countDocuments({ isActive: true }),
      totalAnnouncements: await Announcement.countDocuments({ isActive: true }),
      totalEvents: await Event.countDocuments({ isActive: true }),
      featuredEvents: await Event.countDocuments({ isActive: true, isFeatured: true })
    };

    res.json({
      latestVideos,
      latestAnnouncements,
      featuredEvents,
      stats
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search across all community content
router.get('/search', async (req, res) => {
  try {
    const { q: query, page = 1, limit = 12 } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const Video = require('../models/Video');
    const Announcement = require('../models/Announcement');
    const Event = require('../models/Event');

    const searchQuery = { $text: { $search: query }, isActive: true };
    const pageInt = parseInt(page);
    const limitInt = parseInt(limit);
    const skip = (pageInt - 1) * limitInt;

    // Search videos
    const videos = await Video.find(searchQuery)
      .sort({ score: { $meta: 'textScore' } })
      .limit(Math.ceil(limitInt / 3))
      .select('title description thumbnail category views createdAt');

    // Search announcements  
    const announcements = await Announcement.find(searchQuery)
      .sort({ score: { $meta: 'textScore' } })
      .limit(Math.ceil(limitInt / 3))
      .select('title excerpt priority category createdAt slug');

    // Search events
    const events = await Event.find(searchQuery)
      .sort({ score: { $meta: 'textScore' } })
      .limit(Math.ceil(limitInt / 3))
      .select('title shortDescription eventDate location images category slug views');

    // Combine results
    const results = [
      ...videos.map(item => ({ ...item.toObject(), type: 'video' })),
      ...announcements.map(item => ({ ...item.toObject(), type: 'announcement' })),
      ...events.map(item => ({ ...item.toObject(), type: 'event' }))
    ];

    // Sort by relevance (text score) and paginate
    results.sort((a, b) => (b.score || 0) - (a.score || 0));
    const paginatedResults = results.slice(skip, skip + limitInt);

    res.json({
      results: paginatedResults,
      pagination: {
        current: pageInt,
        pages: Math.ceil(results.length / limitInt),
        total: results.length
      },
      summary: {
        videos: videos.length,
        announcements: announcements.length,
        events: events.length
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get categories and tags for filters
router.get('/metadata/filters', async (req, res) => {
  try {
    const Video = require('../models/Video');
    const Announcement = require('../models/Announcement');
    const Event = require('../models/Event');

    // Get unique categories
    const videoCategories = await Video.distinct('category', { isActive: true });
    const announcementCategories = await Announcement.distinct('category', { isActive: true });
    const eventCategories = await Event.distinct('category', { isActive: true });
    const serviceAreas = await Event.distinct('serviceArea', { isActive: true });

    // Get unique locations
    const locations = await Event.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: { city: '$location.city', country: '$location.country' } } },
      { $project: { _id: 0, city: '$_id.city', country: '$_id.country' } }
    ]);

    // Get popular tags
    const videoTags = await Video.aggregate([
      { $match: { isActive: true } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 }
    ]);

    const announcementTags = await Announcement.aggregate([
      { $match: { isActive: true } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 }
    ]);

    const eventTags = await Event.aggregate([
      { $match: { isActive: true } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 }
    ]);

    res.json({
      categories: {
        videos: videoCategories,
        announcements: announcementCategories,
        events: eventCategories
      },
      serviceAreas,
      locations,
      tags: {
        videos: videoTags.map(tag => tag._id),
        announcements: announcementTags.map(tag => tag._id),
        events: eventTags.map(tag => tag._id)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;