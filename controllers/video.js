const fs = require('fs');
const path = require('path');
const VideoSchema = require('../models/VideoModel');

exports.addVideo = async (req, res) => {
    const { title, description } = req.body;
    const videoPath = req.file.path;

    const video = new VideoSchema({
        title,
        description,
        filename: req.file.filename,
        videoUrl: videoPath,
        subtitles: [],
    });

    try {
        await video.save();
        res.status(200).json({
            message: 'Video Uploaded Successfully',
            video,
        });
    } catch (error) {
        res.status(400).json({
            message: 'Video upload failed',
            error,
        });
    }
};
// Function to add subtitles
exports.addSubtitle = async (req, res) => {
    const { videoId } = req.params;
    const { subtitles } = req.body;

    try {
        // Find the video by ID
        const video = await VideoSchema.findById(videoId);

        // Create or overwrite the .srt file associated with the video
        const subtitleFile = path.join(__dirname, `../public/subtitles/${videoId}.srt`);
        const subtitleStream = fs.createWriteStream(subtitleFile, { flags: 'w' }); // Use 'w' to overwrite the file

        // Iterate through the subtitles and write them to the file
        subtitles.forEach((subtitle, index) => {
            const { startTime, endTime, text } = subtitle;
            subtitleStream.write(`${index + 1}\n`);
            subtitleStream.write(`${startTime} --> ${endTime}\n`);
            subtitleStream.write(`${text}\n\n`);
        });

        subtitleStream.end();

        // Update the video model with the subtitleUrl
        video.subtitleUrl = subtitleFile;
        await video.save();

        res.status(200).json({ message: 'Subtitles added successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.getAllVideos = async (req, res) => {
    try {
        const videos = await VideoSchema.find({});
        res.status(200).json({
            videos,
        });
    } catch (error) {
        res.status(400).json({
            message: 'Videos fetch failed',
            error,
        });
    }
};


// Function to get subtitles file
exports.getSubtitles = async (req, res) => {
    const { videoId } = req.params;

    try {
        // Find the video by ID
        const video = await VideoSchema.findById(videoId);

        if (!video || !video.subtitleUrl) {
            return res.status(404).json({ message: 'Video or subtitles not found' });
        }

        // Read subtitles file
        const subtitlesPath = path.join(__dirname, `../public/subtitles/${videoId}.srt`);
        const subtitlesData = fs.readFileSync(subtitlesPath, 'utf-8');

        // Parse SRT data into an array of objects
        const subtitlesArray = parseSrt(subtitlesData);

        res.status(200).json({ subtitles: subtitlesArray });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Function to parse SRT data into an array of objects
const parseSrt = (srtData) => {
    return srtData
        .split('\n\n')
        .filter(Boolean)
        .map((subtitle) => {
            const lines = subtitle.split('\n');
            const index = lines[0];
            const time = lines[1].split(' --> ');
            const startTime = time[0];
            const endTime = time[1];
            const text = lines.slice(2).join('\n');
            return {
                index,
                startTime,
                endTime,
                text,
            };
        });
};

exports.getSubtitleSrtFile = async (req, res) => {
    const { videoId } = req.params;

    try {
        // Find the video by ID
        const video = await VideoSchema.findById(videoId);

        if (!video || !video.videoUrl) {
            return res.status(404).json({ message: 'Video not found' });
        }

        // Read the .srt file and send its content in the response
        const subtitleFile = path.join(__dirname, '../public/subtitles', `${videoId}.srt`);
        const subtitleData = fs.readFileSync(subtitleFile, 'utf8');

        res.set('Content-Type', 'text/plain');
        res.send(subtitleData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.deleteVideo = async (req, res) => {
    const videoId = req.params.videoId;

    try {
        // Find the video in the database
        const video = await VideoSchema.findById(videoId);

        if (!video) {
            return res.status(404).json({
                message: 'Video not found',
            });
        }

        // Delete the video file from the file system
        const videoFilePath = path.join(__dirname, '..', 'public', 'videos', video.filename);
        
        if (fs.existsSync(videoFilePath)) {
            fs.unlinkSync(videoFilePath);
            console.log('Video file deleted successfully.');
        } else {
            console.log('Video file not found.');
        }

        // Delete the subtitle file if it exists
        if (video.subtitleUrl) {
            const subtitleFilePath = path.join(__dirname, '..', 'public', 'subtitles', video.subtitleUrl);
            
            if (fs.existsSync(subtitleFilePath)) {
                fs.unlinkSync(subtitleFilePath);
                console.log('Subtitle file deleted successfully.');
            } else {
                console.log('Subtitle file not found.');
            }
        }

        // Remove the video from the database
        await VideoSchema.findByIdAndRemove(videoId);

        res.status(200).json({
            message: 'Video deleted successfully',
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error deleting video',
            error,
        });
    }
};

