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
    const shape = shapes[index];
    console.log(`[getShapeForIndex] Индекс ${index} -> форма "${shape}"`);
    return shape;
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
    console.log('[DOMContentLoaded] Начало инициализации приложения');
    loadGoals();
    renderGoals();
    updateCounter();
    console.log('[DOMContentLoaded] Инициализация завершена');
    
    // Обработчик закрытия модального окна по клику вне его
    document.getElementById('goal-modal').addEventListener('click', (e) => {
        if (e.target.id === 'goal-modal') {
            console.log('[Modal] Закрытие модального окна по клику вне его');
            closeModal();
        }
    });
    
    // Закрытие по нажатию Enter
    document.getElementById('goal-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            console.log('[Input] Нажата клавиша Enter, сохранение цели');
            saveGoal();
        }
    });
    
    // Обработчик загрузки изображения
    document.getElementById('goal-image-input').addEventListener('change', (e) => {
        console.log('[ImageUpload] Начало загрузки изображения');
        handleImageUpload(e);
    });
    
    // Обработчики для кнопок модального окна (для совместимости с iOS)
    const btnSave = document.getElementById('btn-save');
    const btnCancel = document.getElementById('btn-cancel');
    const btnClear = document.getElementById('btn-clear-goal');
    const btnRemoveImage = document.getElementById('btn-remove-image');
    
    // Функция для добавления обработчиков клика и касания
    function addButtonHandlers(element, handler) {
        if (!element) return;
        
        let touchHandled = false;
        
        // Обработчик touchend (iOS) - срабатывает первым
        element.addEventListener('touchend', (e) => {
            console.log('[Button] Обработка touchend события');
            touchHandled = true;
            e.preventDefault();
            e.stopPropagation();
            handler(e);
            // Сбросить флаг через небольшую задержку
            setTimeout(() => {
                touchHandled = false;
            }, 300);
        }, { passive: false });
        
        // Обработчик клика (для десктопа и как fallback)
        element.addEventListener('click', (e) => {
            // Если уже обработано через touch, игнорируем click
            if (touchHandled) {
                console.log('[Button] Клик проигнорирован (уже обработан через touch)');
                e.preventDefault();
                e.stopPropagation();
                return;
            }
            console.log('[Button] Обработка click события');
            handler(e);
        });
    }
    
    addButtonHandlers(btnSave, saveGoal);
    addButtonHandlers(btnCancel, closeModal);
    addButtonHandlers(btnClear, clearGoal);
    addButtonHandlers(btnRemoveImage, removeImage);
});

// Открыть модальное окно для редактирования цели
function openGoalModal(index) {
    console.log(`[openGoalModal] Открытие модального окна для цели с индексом ${index}`);
    currentEditingIndex = index;
    const goal = goals[index];
    console.log(`[openGoalModal] Текущая цель:`, { text: goal.text, hasImage: !!goal.image, shape: goal.shape });
    const modal = document.getElementById('goal-modal');
    const input = document.getElementById('goal-input');
    const title = document.getElementById('modal-title');
    const imageInput = document.getElementById('goal-image-input');
    const previewContainer = document.getElementById('image-preview-container');
    const imagePreview = document.getElementById('image-preview');
    
    const clearButton = document.getElementById('btn-clear-goal');
    
    title.innerHTML = 'Редактировать<br>цель';
    
    if (goal.text) {
        input.value = goal.text;
        // Показать кнопку очистки для заполненных целей
        clearButton.style.display = 'block';
    } else {
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
    console.log(`[openGoalModal] Модальное окно открыто для индекса ${index}`);
}

// Закрыть модальное окно
function closeModal() {
    console.log(`[closeModal] Закрытие модального окна (был индекс ${currentEditingIndex})`);
    document.getElementById('goal-modal').classList.remove('active');
    currentEditingIndex = -1;
    // Сбросить превью изображения
    document.getElementById('goal-image-input').value = '';
    document.getElementById('image-preview-container').style.display = 'none';
    document.getElementById('image-preview').src = '';
    console.log('[closeModal] Модальное окно закрыто');
}

// Сжатие изображения для уменьшения размера
function compressImage(file, maxWidth = 800, maxHeight = 800, quality = 0.8) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                
                // Вычисляем новые размеры с сохранением пропорций
                if (width > height) {
                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = (width * maxHeight) / height;
                        height = maxHeight;
                    }
                }
                
                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                // Конвертируем в base64 с заданным качеством
                const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
                console.log(`[compressImage] Изображение сжато: ${(compressedDataUrl.length / 1024).toFixed(2)}KB (было: ${(file.size / 1024).toFixed(2)}KB)`);
                resolve(compressedDataUrl);
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Обработка загрузки изображения
function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) {
        console.log('[handleImageUpload] Файл не выбран');
        return;
    }
    
    console.log(`[handleImageUpload] Выбран файл: ${file.name}, тип: ${file.type}, размер: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
    
    // Проверка типа файла
    if (!file.type.startsWith('image/')) {
        console.warn(`[handleImageUpload] Неверный тип файла: ${file.type}`);
        alert('Пожалуйста, выберите файл изображения');
        return;
    }
    
    // Проверка размера файла (максимум 10MB для исходного файла)
    if (file.size > 10 * 1024 * 1024) {
        console.warn(`[handleImageUpload] Файл слишком большой: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
        alert('Размер файла не должен превышать 10MB');
        return;
    }
    
    // Сжимаем изображение перед отображением
    compressImage(file, 800, 800, 0.8)
        .then(compressedDataUrl => {
            console.log('[handleImageUpload] Изображение успешно сжато, размер base64:', compressedDataUrl.length, 'символов');
            const imagePreview = document.getElementById('image-preview');
            const previewContainer = document.getElementById('image-preview-container');
            imagePreview.src = compressedDataUrl;
            previewContainer.style.display = 'block';
            document.getElementById('image-upload-text').textContent = 'Изменить изображение';
            console.log('[handleImageUpload] Превью изображения отображено');
        })
        .catch(error => {
            console.error('[handleImageUpload] Ошибка при сжатии изображения:', error);
            alert('Ошибка при обработке изображения. Пожалуйста, попробуйте другое изображение.');
        });
}

// Удалить изображение
function removeImage() {
    console.log(`[removeImage] Удаление изображения для цели с индексом ${currentEditingIndex}`);
    document.getElementById('goal-image-input').value = '';
    document.getElementById('image-preview-container').style.display = 'none';
    document.getElementById('image-preview').src = '';
    document.getElementById('image-upload-text').textContent = 'Загрузить изображение';
    
    // Удалить изображение из текущей цели
    if (currentEditingIndex >= 0 && currentEditingIndex < 12) {
        goals[currentEditingIndex].image = null;
        console.log(`[removeImage] Изображение удалено из цели ${currentEditingIndex}`);
    } else {
        console.warn(`[removeImage] Некорректный индекс для удаления: ${currentEditingIndex}`);
    }
}

// Очистить цель
function clearGoal() {
    console.log(`[clearGoal] Очистка цели с индексом ${currentEditingIndex}`);
    if (currentEditingIndex >= 0 && currentEditingIndex < 12) {
        // Очистить текст и изображение
        goals[currentEditingIndex].text = '';
        goals[currentEditingIndex].image = null;
        console.log(`[clearGoal] Цель ${currentEditingIndex} очищена`);
        
        // Сохранить изменения
        saveGoals();
        renderGoals();
        updateCounter();
        
        // Закрыть модалку
        closeModal();
    } else {
        console.warn(`[clearGoal] Некорректный индекс для очистки: ${currentEditingIndex}`);
    }
}

// Сохранить цель
function saveGoal() {
    console.log(`[saveGoal] Начало сохранения цели с индексом ${currentEditingIndex}`);
    const input = document.getElementById('goal-input');
    const goalText = input.value.trim();
    const imagePreview = document.getElementById('image-preview');
    const previewContainer = document.getElementById('image-preview-container');
    
    if (currentEditingIndex >= 0 && currentEditingIndex < 12) {
        if (goalText) {
            goals[currentEditingIndex].text = goalText;
            console.log(`[saveGoal] Текст цели сохранен: "${goalText.substring(0, 50)}${goalText.length > 50 ? '...' : ''}"`);
        } else {
            // Если текст пустой, очищаем цель
            goals[currentEditingIndex].text = '';
            console.log(`[saveGoal] Текст цели очищен (пустая цель)`);
        }
        
        // Сохранить изображение, если оно было загружено
        if (imagePreview.src && previewContainer.style.display !== 'none' && imagePreview.src !== '') {
            goals[currentEditingIndex].image = imagePreview.src;
            console.log(`[saveGoal] Изображение сохранено, размер base64: ${imagePreview.src.length} символов`);
        } else {
            // Если изображение было удалено, очищаем его
            goals[currentEditingIndex].image = null;
            console.log(`[saveGoal] Изображение не сохранено (отсутствует или удалено)`);
        }
        
        console.log(`[saveGoal] Сохранение цели ${currentEditingIndex} в localStorage`);
        saveGoals();
        renderGoals();
        updateCounter();
        closeModal();
        console.log(`[saveGoal] Цель ${currentEditingIndex} успешно сохранена`);
    } else {
        console.error(`[saveGoal] Некорректный индекс для сохранения: ${currentEditingIndex}`);
    }
}

// Отобразить все цели
function renderGoals() {
    console.log('[renderGoals] Начало рендеринга целей');
    const container = document.getElementById('goals-grid');
    
    if (!container) {
        console.error('[renderGoals] Контейнер goals-grid не найден!');
        return;
    }
    
    const filledCount = goals.filter(g => g.text && g.text.trim() !== '').length;
    console.log(`[renderGoals] Рендеринг ${goals.length} целей, заполнено: ${filledCount}`);
    
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
                </div>
            </div>
        `;
    }).join('');
    console.log('[renderGoals] Рендеринг завершен');
}

// Обновить счетчик целей
function updateCounter() {
    const filledCount = goals.filter(g => g.text && g.text.trim() !== '').length;
    console.log(`[updateCounter] Обновление счетчика: ${filledCount}/12 целей заполнено`);
    const counter = document.getElementById('goals-counter');
    if (counter) {
        counter.textContent = `- поставлено ${filledCount}/12 целей`;
        console.log(`[updateCounter] Счетчик обновлен`);
    } else {
        console.error('[updateCounter] Элемент goals-counter не найден!');
    }
}

// Сохранить цели в localStorage
function saveGoals() {
    try {
        const dataToSave = JSON.stringify(goals);
        const sizeInKB = (dataToSave.length / 1024).toFixed(2);
        const sizeInMB = (dataToSave.length / 1024 / 1024).toFixed(2);
        console.log(`[saveGoals] Попытка сохранения в localStorage, размер данных: ${sizeInKB}KB (${sizeInMB}MB)`);
        
        localStorage.setItem('year2026Goals', dataToSave);
        console.log(`[saveGoals] Цели успешно сохранены в localStorage`);
    } catch (e) {
        console.error('[saveGoals] Ошибка при сохранении в localStorage:', e);
        if (e.name === 'QuotaExceededError') {
            alert('Не удалось сохранить данные: недостаточно места в хранилище браузера. Попробуйте удалить некоторые изображения или использовать изображения меньшего размера.');
        } else {
            alert('Ошибка при сохранении данных. Пожалуйста, попробуйте еще раз.');
        }
    }
}

// Загрузить цели из localStorage
function loadGoals() {
    console.log('[loadGoals] Начало загрузки целей из localStorage');
    const saved = localStorage.getItem('year2026Goals');
    if (saved) {
        console.log(`[loadGoals] Найдены сохраненные данные, размер: ${saved.length} символов`);
        try {
            const loaded = JSON.parse(saved);
            console.log(`[loadGoals] Данные успешно распарсены, загружено ${loaded.length} целей`);
            // Объединяем загруженные данные с формами
            goals = goals.map((goal, index) => {
                if (loaded[index]) {
                    const merged = {
                        ...goal,
                        text: loaded[index].text || '',
                        image: loaded[index].image || null
                    };
                    if (merged.text) {
                        console.log(`[loadGoals] Цель ${index} загружена: "${merged.text.substring(0, 30)}${merged.text.length > 30 ? '...' : ''}", изображение: ${merged.image ? 'есть' : 'нет'}`);
                    }
                    return merged;
                }
                return goal;
            });
            const filledCount = goals.filter(g => g.text && g.text.trim() !== '').length;
            console.log(`[loadGoals] Загрузка завершена, заполнено целей: ${filledCount}/12`);
        } catch (e) {
            console.error('[loadGoals] Ошибка загрузки целей:', e);
        }
    } else {
        console.log('[loadGoals] Сохраненные данные не найдены, используются цели по умолчанию');
    }
}

// Экранирование HTML для безопасности
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
