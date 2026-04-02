//index-categories.js
function rememberCategory(categoryName) {
    sessionStorage.setItem('openCategory', categoryName);
  }
  
  function openCategory(category) {
    if (!category) return;
    category.classList.add('open');
  }
  
  function updateToggleAllButton() {
    const btn = document.getElementById('toggleAllCategoriesBtn');
    if (!btn) return;
  
    const lang = document.documentElement.lang === 'ru' ? 'ru' : 'en';
    const categories = document.querySelectorAll('.category');
  
    const allOpen =
      categories.length > 0 &&
      Array.from(categories).every(cat => cat.classList.contains('open'));
  
    const text = allOpen
      ? (lang === 'ru' ? 'Скрыть всё' : 'Hide All')
      : (lang === 'ru' ? 'Показать всё' : 'Show All');
  
    const icon = allOpen ? '▴' : '▾';
  
    btn.innerHTML = `${text} <span class="toggle-icon">${icon}</span>`;
  
    // 👇 ВОТ ЭТО НОВОЕ (цвет состояния)
    if (allOpen) {
      btn.classList.add('is-open');
    } else {
      btn.classList.remove('is-open');
    }
  }
  
  function toggleCategory(header) {
    const category = header.parentElement;
    const wasOpen = category.classList.contains('open');
    const allCategories = document.querySelectorAll('.category');
  
    // Сначала плавно закрываем все остальные
    allCategories.forEach(cat => {
      if (cat !== category) {
        cat.classList.remove('open');
      }
    });
  
    // Если текущая была открыта — закрываем её
    // Если была закрыта — открываем её
    if (wasOpen) {
      category.classList.remove('open');
      sessionStorage.removeItem('openCategory');
    } else {
      category.classList.add('open');
      sessionStorage.setItem('openCategory', category.dataset.category);
    }
  
    updateToggleAllButton();
  }
  
  function toggleAllCategories() {
    const categories = document.querySelectorAll('.category');
    if (!categories.length) return;
  
    const allOpen = Array.from(categories).every(cat =>
      cat.classList.contains('open')
    );
  
    categories.forEach(cat => {
      if (allOpen) {
        cat.classList.remove('open');
      } else {
        cat.classList.add('open');
      }
    });
  
    if (allOpen) {
      sessionStorage.removeItem('openCategory');
    } else {
      sessionStorage.setItem('openCategory', 'all');
    }
  
    updateToggleAllButton();
  }
  
  document.addEventListener('DOMContentLoaded', function () {
    const toggleBtn = document.getElementById('toggleAllCategoriesBtn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', toggleAllCategories);
    }
  
    const savedCategory = sessionStorage.getItem('openCategory');
  
    if (savedCategory === 'all') {
      document.querySelectorAll('.category').forEach(category => {
        category.classList.add('open');
      });
    } else if (savedCategory) {
      const category = document.querySelector(
        `.category[data-category="${savedCategory}"]`
      );
  
      if (category) {
        openCategory(category);
      }
    }
  
    updateToggleAllButton();
  });