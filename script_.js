// Modal JavaScript
const modal = document.getElementById("theory-modal");
const trigger = document.querySelector(".modal-trigger");
const span = document.querySelector(".modal-close");

trigger.onclick = function() {
    modal.style.display = "block";
}

span.onclick = function() {
    modal.style.display = "none";
}

window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
}

// Получаем все вкладки
const tabs = document.querySelectorAll('.tab-lang-edditor');
let data = null; // Переменная для хранения данных из data.json

// Функция для загрузки и отображения данных
async function displayData() {
    try {
        // Загружаем data.json
        const response = await fetch('data.json');
        data = await response.json();

        // Получаем элементы
        // const textarea = document.getElementById('input-data');
        const editor = CodeMirror.fromTextArea(document.getElementById('input-data'), {
            mode: "htmlmixed", // Режим для HTML (включает JS и CSS)
            theme: "monokai", // Тема подсветки
            lineNumbers: true, // Показывать номера строк
            autoCloseTags: true, // Автозакрытие тегов
            matchBrackets: true, // Подсветка парного соответствия скобок
            indentUnit: 2, // Отступ в пробелах
            tabSize: 2, // Размер табуляции
            lineWrapping: true // Перенос строк
        });
        const iframe = document.getElementById('preview');

        // Отображаем HTML по умолчанию (первая вкладка активна)
        // textarea.value = data.html;
        editor.value = data.html

        // Обновляем превью в iframe
        updatePreview(data.html);

        // Проверяем выполнение задач
        checkTasks(data.html, data.tasks);
    } catch (error) {
        console.error('Ошибка загрузки data.json:', error);
    }
}

// Функция для обновления превью в iframe
function updatePreview(htmlContent, cssContent = '') {
    const iframe = document.getElementById('preview');
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    iframeDoc.open();
    // Если есть CSS, добавляем его в <style> внутри HTML
    const fullHtml = cssContent
        ? htmlContent.replace('</head>', `<style>${cssContent}</style></head>`)
        : htmlContent;
    iframeDoc.write(fullHtml);
    iframeDoc.close();
}

// Функция для проверки выполнения задач
function checkTasks(htmlContent, tasks) {
    let completedTasks = 0;
    const taskTable = document.querySelector('.task-table');
    const taskCounter = document.querySelector('.task-counter');

    // Проверяем каждую задачу
    tasks.forEach((task, index) => {
        const taskItem = taskTable.children[index];
        let isCompleted = false;

        if (index === 0) {
            // Проверка: раскомментирован ли <link> на 6-й строке
            const lines = htmlContent.split('\n');
            const linkLine = lines[5]; // 6-я строка (индекс 5)
            isCompleted = linkLine.includes('<link rel="stylesheet" href="style.css">') && !linkLine.includes('<!--');
        } else if (index === 1) {
            // Проверка: добавлен ли класс .active к .tab-lang-edditor
            isCompleted = htmlContent.includes('tab-lang-edditor active');
        }

        // Обновляем стиль задачи
        if (isCompleted) {
            taskItem.classList.remove('failure')
            taskItem.classList.add('completed');
            completedTasks++;
        } else {
            taskItem.classList.add('failure')
            taskItem.classList.remove('completed');
        }
    });

    // Обновляем счетчик задач
    taskCounter.textContent = `(Выполнено ${completedTasks} из ${tasks.length})`;
}

// Обработчик клика по вкладкам
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        // Удаляем класс active со всех вкладок
        tabs.forEach(t => t.classList.remove('active'));
        // Добавляем класс active к кликнутой вкладке
        tab.classList.add('active');

        // Получаем тип вкладки (html или css)
        const type = tab.getAttribute('type-lang');
        const textarea = document.getElementById('input-data');

        if (data) {
            if (type === 'html') {
                // Показываем HTML
                textarea.value = data.html;
                updatePreview(data.html, data.css); // Обновляем превью с CSS
            } else if (type === 'css') {
                // Показываем CSS
                textarea.value = data.css;
                updatePreview(data.html, data.css); // Превью остается с HTML и CSS
            }
        }
    });
});

// Вызываем функцию при загрузке страницы
document.addEventListener('DOMContentLoaded', displayData);

// Обновляем превью и задачи при изменении текста в textarea
document.getElementById('input-data').addEventListener('input', function () {
    const content = this.value;
    const activeTab = document.querySelector('.tab-lang-edditor.active');
    const type = activeTab.getAttribute('type-lang');

    if (type === 'html') {
        // Если активна вкладка HTML, обновляем HTML
        data.html = content;
        updatePreview(content, data.css);
        checkTasks(content, data.tasks);
    } else if (type === 'css') {
        // Если активна вкладка CSS, обновляем CSS
        data.css = content;
        updatePreview(data.html, content);
    }
});