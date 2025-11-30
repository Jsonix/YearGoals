// Формы для каждого слота (разные формы, как на изображении)
const shapes = [
    'Circle',        // 0 - круг
    'Star',          // 1 - звезда
    'PartyStar',     // 2 - PartyStar.svg
    'Circle',        // 3 - круг
    'RelaxedStar',   // 4 - RelaxedStar.svg
    'Heart',         // 5 - Heart.svg
    'Circle',        // 6 - круг
    'Star',          // 7 - звезда
    'PartyStar',     // 8 - PartyStar.svg
    'Circle',        // 9 - круг
    'RelaxedStar',   // 10 - RelaxedStar.svg
    'Heart'          // 11 - Heart.svg
];

function getShapeForIndex(index) {
    return shapes[index];
}

// Массив для хранения 12 целей (по умолчанию все пустые)
let goals = Array(12).fill(null).map((_, index) => ({
    id: index,
    text: '',
    image: null, // base64 строка изображения
    shape: getShapeForIndex(index)
}));

let currentEditingIndex = -1;

// Загрузка целей из localStorage при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    loadGoals();
    renderGoals();
    updateCounter();
    
    // Обработчик закрытия модального окна по клику вне его
    document.getElementById('goal-modal').addEventListener('click', (e) => {
        if (e.target.id === 'goal-modal') {
            closeModal();
        }
    });
    
    // Закрытие по нажатию Enter
    document.getElementById('goal-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            saveGoal();
        }
    });
    
    // Обработчик загрузки изображения
    document.getElementById('goal-image-input').addEventListener('change', (e) => {
        handleImageUpload(e);
    });
});

// Открыть модальное окно для редактирования цели
function openGoalModal(index) {
    currentEditingIndex = index;
    const goal = goals[index];
    const modal = document.getElementById('goal-modal');
    const input = document.getElementById('goal-input');
    const title = document.getElementById('modal-title');
    const imageInput = document.getElementById('goal-image-input');
    const previewContainer = document.getElementById('image-preview-container');
    const imagePreview = document.getElementById('image-preview');
    
    const clearButton = document.getElementById('btn-clear-goal');
    
    if (goal.text) {
        title.innerHTML = 'Редактировать<br>цель';
        input.value = goal.text;
        // Показать кнопку очистки для заполненных целей
        clearButton.style.display = 'block';
    } else {
        title.innerHTML = '';
        input.value = '';
        // Скрыть кнопку очистки для пустых целей
        clearButton.style.display = 'none';
    }
    
    // Загрузить изображение, если оно есть
    if (goal.image) {
        imagePreview.src = goal.image;
        previewContainer.style.display = 'block';
        document.getElementById('image-upload-text').textContent = 'Изменить изображение';
    } else {
        previewContainer.style.display = 'none';
        document.getElementById('image-upload-text').textContent = 'Загрузить изображение';
    }
    
    // Сбросить input файла
    imageInput.value = '';
    
    modal.classList.add('active');
    input.focus();
    input.select();
}

// Закрыть модальное окно
function closeModal() {
    document.getElementById('goal-modal').classList.remove('active');
    currentEditingIndex = -1;
    // Сбросить превью изображения
    document.getElementById('goal-image-input').value = '';
    document.getElementById('image-preview-container').style.display = 'none';
    document.getElementById('image-preview').src = '';
}

// Обработка загрузки изображения
function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Проверка типа файла
    if (!file.type.startsWith('image/')) {
        alert('Пожалуйста, выберите файл изображения');
        return;
    }
    
    // Проверка размера файла (максимум 5MB)
    if (file.size > 5 * 1024 * 1024) {
        alert('Размер файла не должен превышать 5MB');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const imagePreview = document.getElementById('image-preview');
        const previewContainer = document.getElementById('image-preview-container');
        imagePreview.src = e.target.result;
        previewContainer.style.display = 'block';
        document.getElementById('image-upload-text').textContent = 'Изменить изображение';
    };
    reader.readAsDataURL(file);
}

// Удалить изображение
function removeImage() {
    document.getElementById('goal-image-input').value = '';
    document.getElementById('image-preview-container').style.display = 'none';
    document.getElementById('image-preview').src = '';
    document.getElementById('image-upload-text').textContent = 'Загрузить изображение';
    
    // Удалить изображение из текущей цели
    if (currentEditingIndex >= 0 && currentEditingIndex < 12) {
        goals[currentEditingIndex].image = null;
    }
}

// Очистить цель
function clearGoal() {
    if (currentEditingIndex >= 0 && currentEditingIndex < 12) {
        // Очистить текст и изображение
        goals[currentEditingIndex].text = '';
        goals[currentEditingIndex].image = null;
        
        // Сохранить изменения
        saveGoals();
        renderGoals();
        updateCounter();
        
        // Закрыть модалку
        closeModal();
    }
}

// Сохранить цель
function saveGoal() {
    const input = document.getElementById('goal-input');
    const goalText = input.value.trim();
    const imagePreview = document.getElementById('image-preview');
    const previewContainer = document.getElementById('image-preview-container');
    
    if (currentEditingIndex >= 0 && currentEditingIndex < 12) {
        if (goalText) {
            goals[currentEditingIndex].text = goalText;
        } else {
            // Если текст пустой, очищаем цель
            goals[currentEditingIndex].text = '';
        }
        
        // Сохранить изображение, если оно было загружено
        if (imagePreview.src && previewContainer.style.display !== 'none' && imagePreview.src !== '') {
            goals[currentEditingIndex].image = imagePreview.src;
        } else {
            // Если изображение было удалено, очищаем его
            goals[currentEditingIndex].image = null;
        }
        
        saveGoals();
        renderGoals();
        updateCounter();
        closeModal();
    }
}

// Отобразить все цели
function renderGoals() {
    const container = document.getElementById('goals-grid');
    
    if (!container) {
        console.error('Контейнер goals-grid не найден!');
        return;
    }
    
    container.innerHTML = goals.map((goal, index) => {
        const isEmpty = !goal.text || goal.text.trim() === '';
        const shapeImage = `images/goalsWithText/${goal.shape}.svg`;
        const slotClass = isEmpty ? 'goal-slot empty' : 'goal-slot filled';
        const displayText = isEmpty ? '' : goal.text;
        const hasImage = goal.image && goal.image.trim() !== '';
        
        // Определяем класс маски в зависимости от формы
        const maskClass = `mask-${goal.shape.toLowerCase()}`;
        
        return `
            <div class="${slotClass}" onclick="openGoalModal(${index})">
                <div class="goal-shape">
                    <img src="${shapeImage}" alt="${goal.shape}" class="shape-image" 
                         onerror="console.error('Ошибка загрузки изображения:', '${shapeImage}')">
                    ${hasImage ? `<img src="${goal.image}" alt="Цель" class="goal-custom-image ${maskClass}">` : ''}
                    <div class="goal-text">${escapeHtml(displayText)}</div>
                </div>
            </div>
        `;
    }).join('');
}

// Обновить счетчик целей
function updateCounter() {
    const filledCount = goals.filter(g => g.text && g.text.trim() !== '').length;
    const counter = document.getElementById('goals-counter');
    counter.textContent = `- поставлено ${filledCount}/12 целей`;
}

// Сохранить цели в localStorage
function saveGoals() {
    localStorage.setItem('year2026Goals', JSON.stringify(goals));
}

// Загрузить цели из localStorage
function loadGoals() {
    const saved = localStorage.getItem('year2026Goals');
    if (saved) {
        try {
            const loaded = JSON.parse(saved);
            // Объединяем загруженные данные с формами
            goals = goals.map((goal, index) => {
                if (loaded[index]) {
                    return {
                        ...goal,
                        text: loaded[index].text || '',
                        image: loaded[index].image || null
                    };
                }
                return goal;
            });
        } catch (e) {
            console.error('Ошибка загрузки целей:', e);
        }
    }
}

// Экранирование HTML для безопасности
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
