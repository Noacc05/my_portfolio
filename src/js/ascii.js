const ASCII_CHARS = " .-:=+*ITLCVJUYFPZAOESGHKRDBWM#@";
const BLOCK_SIZE = 12; // Size of the ASCII characters
const EDGE_THRESHOLD = 50; // Sensitivity of the edge detection

const video = document.getElementById('webcam');
const canvas = document.getElementById('ascii-canvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('start-btn');

// We use an offscreen canvas to quickly downscale the video and read pixel data
const offscreenCanvas = document.createElement('canvas');
const offscreenCtx = offscreenCanvas.getContext('2d', { willReadFrequently: true });

let cols, rows;

async function initCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 } });
        video.srcObject = stream;
        
        video.onloadedmetadata = () => {
            video.play();
            
            // Match main canvas to window size
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            
            // Calculate grid size
            cols = Math.floor(canvas.width / BLOCK_SIZE);
            rows = Math.floor(canvas.height / BLOCK_SIZE);
            
            // Size the hidden canvas to our grid size for fast processing
            offscreenCanvas.width = cols;
            offscreenCanvas.height = rows;
            
            ctx.font = `${BLOCK_SIZE}px monospace`;
            ctx.textBaseline = "top";
            
            startBtn.style.display = 'none';
            requestAnimationFrame(processFrame);
        };
    } catch (err) {
        console.error("Camera access denied:", err);
        alert("Could not access the camera.");
    }
}

// Helper function to get grayscale value from a 1D pixel array
function getGray(data, x, y, width) {
    if (x < 0 || x >= width || y < 0 || y >= data.length / 4 / width) return 0;
    const idx = (y * width + x) * 4;
    // Standard luminance formula
    return data[idx] * 0.299 + data[idx+1] * 0.587 + data[idx+2] * 0.114;
}

function processFrame() {
    // 1. Draw the current video frame shrunk down to our grid size
    offscreenCtx.drawImage(video, 0, 0, cols, rows);
    const frameData = offscreenCtx.getImageData(0, 0, cols, rows).data;
    
    // Clear the main canvas
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 2. Loop through our grid (skipping the very outer 1px border to avoid out-of-bounds math)
    for (let y = 1; y < rows - 1; y++) {
        for (let x = 1; x < cols - 1; x++) {
            
            // Get surrounding pixels for Sobel Math
            const tl = getGray(frameData, x-1, y-1, cols);
            const tc = getGray(frameData, x,   y-1, cols);
            const tr = getGray(frameData, x+1, y-1, cols);
            const cl = getGray(frameData, x-1, y,   cols);
            const cr = getGray(frameData, x+1, y,   cols);
            const bl = getGray(frameData, x-1, y+1, cols);
            const bc = getGray(frameData, x,   y+1, cols);
            const br = getGray(frameData, x+1, y+1, cols);
            
            // Sobel Kernels
            const gx = -tl + tr - 2*cl + 2*cr - bl + br;
            const gy = -tl - 2*tc - tr + bl + 2*bc + br;
            
            // Magnitude (strength) and Angle (direction)
            const magnitude = Math.sqrt(gx*gx + gy*gy);
            let angle = Math.atan2(gy, gx) * (180 / Math.PI);
            if (angle < 0) angle += 180; // Normalize to 0-180 degrees
            
            let char = " ";
            
            // Center pixel data for color and brightness
            const centerIdx = (y * cols + x) * 4;
            const r = frameData[centerIdx];
            const g = frameData[centerIdx + 1];
            const b = frameData[centerIdx + 2];
            const brightness = getGray(frameData, x, y, cols);
            
            // 3. Map characters
            if (magnitude > EDGE_THRESHOLD) {
                // Map edge angles to characters
                if (angle < 22.5 || angle >= 157.5) char = '|';
                else if (angle >= 22.5 && angle < 67.5) char = '/';
                else if (angle >= 67.5 && angle < 112.5) char = '-';
                else char = '\\';
            } else {
                // Map brightness to ASCII density
                const charIndex = Math.floor((brightness / 255) * 31);
                char = ASCII_CHARS[charIndex];
            }
            
            // 4. Draw to the main canvas
            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
            ctx.fillText(char, x * BLOCK_SIZE, y * BLOCK_SIZE);
        }
    }
    
    // Loop
    requestAnimationFrame(processFrame);
}

startBtn.addEventListener('click', initCamera);

// Handle window resizing
window.addEventListener('resize', () => {
    if (!video.srcObject) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    cols = Math.floor(canvas.width / BLOCK_SIZE);
    rows = Math.floor(canvas.height / BLOCK_SIZE);
    offscreenCanvas.width = cols;
    offscreenCanvas.height = rows;
    ctx.font = `${BLOCK_SIZE}px monospace`;
    ctx.textBaseline = "top";
});