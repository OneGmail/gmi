const modal = document.getElementById("theory-modal");
const trigger = document.querySelector(".modal-trigger");
const span = document.querySelector(".modal-close");

trigger.onclick = function () {
    modal.style.display = "block";
};

span.onclick = function () {
    modal.style.display = "none";
};

window.onclick = function (event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
};

// Получаем все вкладки
const tabs = document.querySelectorAll(".tab-lang-edditor");
let data = null; // Переменная для хранения данных из data.json
let editor = null; // Переменная для хранения экземпляра CodeMirror

// Функция для загрузки и отображения данных
async function displayData() {
    try {
        const response = await fetch("data.json", { cache: "no-store" });
        if (!response.ok) {
            throw new Error(`Не удалось загрузить data.json: ${response.status} ${response.statusText}`);
        }
        data = await response.json(); // Обновляем глобальную переменную data
        console.log("Загруженные данные:", data);

        // Проверяем наличие ключей
        if (!('html' in data) || !('css' in data) || !('tasks' in data) || !('donehtml' in data)) {
            throw new Error("Некорректная структура data.json: отсутствуют необходимые ключи");
        }

        // Устанавливаем значение по умолчанию для js, если отсутствует
        data.js = data.js || "";

        // Инициализируем CodeMirror
        editor = CodeMirror.fromTextArea(
            document.getElementById("input-data"),
            {
                mode: "htmlmixed",
                theme: "monokai",
                lineNumbers: true,
                autoCloseTags: true,
                matchBrackets: true,
                indentUnit: 2,
                tabSize: 2,
                lineWrapping: true,
                autoCloseBrackets: true,
            }
        );

        // Устанавливаем начальное значение (HTML по умолчанию)
        editor.setValue(data.html || "");
        updatePreview(data.html, data.css, data.js);

        // Проверяем выполнение задач
        checkTasks(data.html, data.tasks);

        // Обновляем данные и превью при изменении в редакторе
        editor.on("change", () => {
            const content = editor.getValue();
            const activeTab = document.querySelector(".tab-lang-edditor.active");
            const type = activeTab.getAttribute("type-lang");

            if (type === "html") {
                data.html = content;
                updatePreview(content, data.css, data.js);
                checkTasks(content, data.tasks);
            } else if (type === "css") {
                data.css = content;
                updatePreview(data.html, content, data.js);
            } else if (type === "javascript") {
                data.js = content;
                updatePreview(data.html, data.css, content);
            }
        });

        // Обработчик клика по вкладкам
        tabs.forEach((tab) => {
            tab.addEventListener("click", () => {
                tabs.forEach((t) => t.classList.remove("active"));
                tab.classList.add("active");

                const type = tab.getAttribute("type-lang");
                if (data) {
                    if (type === "html") {
                        editor.setOption("mode", "htmlmixed");
                        editor.setValue(data.html || "");
                    } else if (type === "css") {
                        editor.setOption("mode", "css");
                        editor.setValue(data.css || "");
                    } else if (type === "javascript") {
                        editor.setOption("mode", "javascript");
                        editor.setValue(data.js || "");
                    }
                    updatePreview(data.html, data.css, data.js);
                }
            });
        });
    } catch (error) {
        console.error("Ошибка загрузки data.json:", error.message, error.stack);
        editor && editor.setValue("// Ошибка загрузки данных: " + error.message);
    }
}

// Функция для проверки наличия активного <link> (не закомментированного)
function hasActiveStylesheet(htmlContent) {
    // Удаляем все комментарии из HTML
    const withoutComments = htmlContent.replace(/<!--[\s\S]*?-->/g, '');
    // Проверяем наличие <link rel="stylesheet" href="style.css">
    return withoutComments.includes('<link rel="stylesheet" href="style.css">');
}

// Функция для обновления превью в iframe
function updatePreview(htmlContent, cssContent = "", jsContent = "") {
    const iframe = document.getElementById("preview");
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    iframeDoc.open();

    // Проверяем наличие активного <link> (не закомментированного)
    const hasStylesheet = hasActiveStylesheet(htmlContent);
    const css = hasStylesheet ? cssContent : ""; // Применяем CSS только если <link> активен

    const fullHtml = `
        ${htmlContent}
        <style>${css}</style>
        <script>
            try {
                ${jsContent}
            } catch (e) {
                console.error('Ошибка выполнения JS:', e);
            }
        </script>
    `;
    try {
        iframeDoc.write(fullHtml);
    } catch (e) {
        console.error("Ошибка при рендеринге превью:", e);
        iframeDoc.write("<p>Ошибка в HTML: проверьте синтаксис</p>");
    }
    iframeDoc.close();
}

// Функция для проверки выполнения задач
function checkTasks(htmlContent, tasks) {
    let completedTasks = 0;
    const taskTable = document.querySelector(".task-table");
    const taskCounter = document.querySelector(".task-counter");

    tasks.forEach((task, index) => {
        const taskItem = taskTable.children[index];
        let isCompleted = false;

        if (index === 0) {
            isCompleted = hasActiveStylesheet(htmlContent); // Используем ту же проверку для задач
        } else if (index === 1) {
            isCompleted = document.querySelector(".tab-lang-edditor.active") !== null;
        }

        // if (isCompleted) {
        //     taskItem.classList.remove("failure");
        //     taskItem.classList.add("completed");
        //     // completedTasks++;
        // } else {
        //     taskItem.classList.add("failure");
        //     taskItem.classList.remove("completed");
        // }
    });

    // Проверяем, совпадает ли текущий HTML с donehtml
    const normalizedCurrent = htmlContent.replace(/\s+/g, ' ').trim();
    const normalizedDone = data.donehtml.replace(/\s+/g, ' ').trim();
    const isHtmlCorrect = normalizedCurrent === normalizedDone;

    const _1task = document.getElementById('task-meta-1');
    const _1icon = _1task.querySelector('#task-icon');


    if (isHtmlCorrect) {
        // console.log("HTML полностью соответствует donehtml!");
        completedTasks++;
        _1icon.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" fill="white" viewBox="0 0 16 16">
                                            <path d="M13.485 1.929a1 1 0 0 1 0 1.414L6.343 10.485a1 1 0 0 1-1.414 0L2.515 8.07a1 1 0 1 1 1.414-1.414L6 8.727l6.071-6.071a1 1 0 0 1 1.414 0z"/>
                                        </svg>
        `
    } else {
        _1icon.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path d="M4.646 4.646a.5.5 0 011 0L8 7.293l2.354-2.647a.5.5 0 11.707.707L8.707 8l2.647 2.354a.5.5 0 01-.707.707L8 8.707l-2.354 2.647a.5.5 0 01-.707-.707L7.293 8 4.646 5.646a.5.5 0 010-.707z"/></svg>
        `
    }

    taskCounter.textContent = `(Выполнено ${completedTasks} из ${tasks.length})`;
}

// Вызываем функцию при загрузке страницы
document.addEventListener("DOMContentLoaded", displayData);