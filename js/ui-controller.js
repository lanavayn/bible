window.UIController = {
    active: null,
  
    open(id) {
      const blocks = ["daily-verse", "question-of-day"];
  
      blocks.forEach(blockId => {
        const root = document.getElementById(blockId);
        if (!root) return;
  
        const card = root.querySelector(".daily-verse-card");
  
        if (blockId === id) {
          if (card) card.style.display = "block";
        } else {
          if (card) card.style.display = "none";
        }
      });
  
      this.active = id;
    },
  
    close(id) {
      const root = document.getElementById(id);
      if (!root) return;
  
      const card = root.querySelector(".daily-verse-card");
      if (card) {
        card.style.display = "none";
      }
  
      this.active = null;
    }
  };