const getBackendStatus = async () => {
  const response = await fetch("/status").then((r) => r.status);
  console.log("Backend status from client: 200");
};

window.onload = () => {
  console.log("Loaded!");

  getBackendStatus();
};
