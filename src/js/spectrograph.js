const canvas = document.getElementById('spectrogram');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('start-btn');

// Match canvas resolution to the window size
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let audioContext, analyser, dataArray, bufferLength;

async function initAudio() {
    try {
        // 1. Request microphone access from macOS
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // 2. Initialize the Web Audio API
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const source = audioContext.createMediaStreamSource(stream);
        
        // 3. Create the AnalyserNode to handle the FFT math
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 4096; // Higher = more frequency detail, but slower
        analyser.smoothingTimeConstant = 0.25; // Keeps the visual relatively sharp
        
        source.connect(analyser);
        
        // 4. Create an array to hold the frequency data
        bufferLength = analyser.frequencyBinCount/2; // Half of fftSize (1024 bins)
        dataArray = new Uint8Array(bufferLength);
        
        // Hide button and start drawing
        startBtn.style.display = 'none';
        draw();
        
    } catch (err) {
        console.error('Microphone access denied or failed:', err);
        alert('Could not access microphone. Check macOS System Settings > Privacy & Security.');
    }
}

function draw() {
    // Loop this function on every screen refresh (~60 FPS)
    requestAnimationFrame(draw);

    // Grab the current frequency data from the audio chunk
    analyser.getByteFrequencyData(dataArray);

    // Shift the entire canvas image left by 2 pixels to create a scrolling history
    ctx.drawImage(canvas, -2, 0);

    // Draw the new column of data on the far right edge
    const sliceWidth = 2;
    const x = canvas.width - sliceWidth;
    
    // We only loop through the lower half of the frequencies.
    // The very top frequencies (approaching 20kHz) are usually empty air noise.
    const usableBins = Math.floor(bufferLength * 0.75); 
    const blockHeight = canvas.height / usableBins;

    for (let i = 0; i < usableBins; i++) {
        const value = dataArray[i]; // Value between 0 (silent) and 255 (loud)

        // Map the frequency array to the Y axis (low pitches at bottom, high at top)
        const y = canvas.height - (i * blockHeight);

        // Map amplitude to a "heat" color (Black -> Blue -> Purple -> Bright Pink/White)
        if (value === 0) {
            ctx.fillStyle = 'black';
        } else {
            const r = value;
            const g = Math.max(0, value - 128); 
            const b = value > 128 ? 255 : value * 2;
            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        }

        ctx.fillRect(x, y, sliceWidth, blockHeight);
    }
}

// Wait for user interaction to start
startBtn.addEventListener('click', initAudio);

// Handle window resizing
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});