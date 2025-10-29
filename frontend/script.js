const video = document.getElementById("video");
const stopBtn = document.getElementById("stopBtn");

if (video) {
  navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
    video.srcObject = stream;
    document.getElementById("status").textContent = "Camera Active - Scanning...";
    
    simulateDetection();
  });

  stopBtn.addEventListener("click", () => {
    const stream = video.srcObject;
    const tracks = stream.getTracks();
    tracks.forEach(track => track.stop());
    document.getElementById("status").textContent = "Camera Stopped";
  });
}

async function simulateDetection() {
  const gait = (80 + Math.random() * 20).toFixed(2);
  const auth = (70 + Math.random() * 30).toFixed(2);
  const name = Math.random() > 0.5 ? "Known User" : "Unknown Visitor";
  const status = name === "Known User" ? "Access Granted ✅" : "Alert 🚨";

  document.getElementById("name").textContent = name;
  document.getElementById("gait").textContent = gait + "%";
  document.getElementById("auth").textContent = auth + "%";
  document.getElementById("status").textContent = status;

  await fetch("http://localhost:3000/api/logs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name,
      gait: gait + "%",
      auth: auth + "%",
      status,
      time: new Date().toLocaleString(),
    }),
  });
}
