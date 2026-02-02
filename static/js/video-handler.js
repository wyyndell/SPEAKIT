document.addEventListener('DOMContentLoaded', function() {
    const videoFilesData = document.getElementById('video-files-data');
    const videoFiles = videoFilesData ? JSON.parse(videoFilesData.textContent) : [];

    const videoPlayer = document.getElementById('videoPlayer');
    const videoSource = document.getElementById('videoSource');
    const noVideoImage = document.getElementById('no-video');
    let currentVideoIndex = 0;

    function playNextVideo() {
        if (currentVideoIndex < videoFiles.length - 1) {
            currentVideoIndex++;
            videoPlayer.style.opacity = 0; // Fade out current video

            setTimeout(() => {
                videoSource.src = "/static/mp4/" + videoFiles[currentVideoIndex];
                videoPlayer.load();
                videoPlayer.play();
            }, 200); // Delay to allow fade-out transition
        } else {
            videoPlayer.style.display = 'none';
            noVideoImage.style.display = 'block';
        }
    }

    function preloadNextVideos() {
        for (let i = currentVideoIndex + 1; i <= currentVideoIndex + 2 && i < videoFiles.length; i++) {
            const nextVideo = new Video();
            nextVideo.src = "/static/mp4/" + videoFiles[i];
            nextVideo.preload = 'auto';
        }
    }


    videoPlayer.addEventListener('ended', playNextVideo);
    videoPlayer.addEventListener('play', function() {
        videoPlayer.style.display = 'block';
        noVideoImage.style.display = 'none';
        videoPlayer.style.opacity = 1; // Fade in new video
        videoPlayer.playbackRate = 0.90;  // Slows down video playback to 90% of normal speed
        preloadNextVideo();
    });

    if (videoFiles.length > 0) {
        videoSource.src = "/static/mp4/" + videoFiles[0];
        videoPlayer.style.display = 'block';
        noVideoImage.style.display = 'none';
        videoPlayer.load();
        videoPlayer.play();
        videoPlayer.style.opacity = 1; // Fade in initial video
    } else {
        videoPlayer.style.display = 'none';
        noVideoImage.style.display = 'block';
    }
});
