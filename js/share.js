document.addEventListener("click", async function (event) {
  const shareBtn = event.target.closest(".share-button");
  if (!shareBtn) return;

  event.preventDefault();

  const shareData = {
    title: document.title,
    text: "Check out this page:",
    url: window.location.href
  };

  // 📱 Mobile — native share
  if (navigator.share && /Android|iPhone|iPad/i.test(navigator.userAgent)) {
    try {
      await navigator.share(shareData);
      return;
    } catch (error) {
      console.log("Share cancelled");
    }
  }

  // 💻 Desktop — popup под header
  showSharePopup();
});

function showSharePopup() {
  const existingPopup = document.getElementById("share-popup");
  if (existingPopup) {
    existingPopup.remove();
    return;
  }

  window.PopupManager?.closeAll();

  let popup = null;

  if (!popup) {
    popup = document.createElement("div");
    popup.id = "share-popup";

    popup.style.position = "fixed";
    popup.style.top = "70px"; // под header
    popup.style.left = "50%";
    popup.style.transform = "translateX(-50%)";
    popup.style.background = "#fff";
    popup.style.border = "1px solid #ddd";
    popup.style.borderRadius = "12px";
    popup.style.padding = "12px";
    popup.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
    popup.style.zIndex = "9999";
    popup.style.minWidth = "200px";

    const isRu = document.documentElement.lang?.startsWith("ru");

    popup.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:10px;">
        <a href="mailto:?subject=${encodeURIComponent(document.title)}&body=${encodeURIComponent(window.location.href)}">
          📧 ${isRu ? "Отправить по email" : "Send via email"}
        </a>

        <button id="copyLinkBtn">
          📋 ${isRu ? "Скопировать ссылку" : "Copy link"}
        </button>
      </div>
    `;

    document.body.appendChild(popup);

    document.getElementById("copyLinkBtn").addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(window.location.href);
        showToast();
      } catch {
        prompt("Copy this link:", window.location.href);
      }
      popup.remove();
    });

    // закрытие по клику вне
    setTimeout(() => {
      document.addEventListener("click", function closePopup(e) {
        if (!popup.contains(e.target)) {
          popup.remove();
          document.removeEventListener("click", closePopup);
        }
      });
    }, 0);
  }
}

function showToast() {
  let toast = document.getElementById("copy-toast");

  if (!toast) {
    toast = document.createElement("div");
    toast.id = "copy-toast";

    toast.style.position = "fixed";
    toast.style.top = "70px";
    toast.style.left = "50%";
    toast.style.transform = "translateX(-50%)";
    toast.style.background = "#333";
    toast.style.color = "#fff";
    toast.style.padding = "10px 16px";
    toast.style.borderRadius = "8px";
    toast.style.fontSize = "14px";
    toast.style.zIndex = "9999";
    toast.style.opacity = "0";
    toast.style.transition = "opacity 0.3s";

    document.body.appendChild(toast);
  }

  const isRu = document.documentElement.lang?.startsWith("ru");
  toast.textContent = isRu ? "Ссылка скопирована" : "Link copied";

  toast.style.opacity = "1";

  setTimeout(() => {
    toast.style.opacity = "0";
  }, 2000);
}
