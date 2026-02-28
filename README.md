# Line Master

## English

**Line Master** is a Chrome extension for chess that shows opening theory moves during your game, no need to study theory anymore.

Supported platforms:
- chess.com

support of lichess.org will be added later

---

### Features
- Detects your current board position.
- Finds theoretical moves from a local opening database.
- Shows recommendations in the extension popup.
- Can draw move hints directly on the board (overlay).
- Lets you save openings to favorites.
- Includes rating filters and performance modes.
- Supports English and Russian UI.

---

### Installation (Chrome Developer Mode)
> This version is not published in Chrome Web Store yet, it will most likely not be approved.

1. Download the project (ZIP or `git clone`).
2. Open the project folder in terminal.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Build the extension:
   ```bash
   npm run build
   ```
5. Open `chrome://extensions` in Chrome.
6. Enable **Developer mode**.
7. Click **Load unpacked**.
8. Select the `dist` folder from this project.

After code changes, run `npm run build` again and click **Reload** for the extension in `chrome://extensions`.

---

### How to Use
1. Open a game on chess.com or lichess.org.
2. Click the extension icon.
3. On the Home screen, press **Launch** to enable hints.
4. Use tabs:
   - **Openings** — opening library,
   - **Favorites** — saved openings,
   - **Settings** — language, rating, limits, performance.

---

### Performance Modes
In **Settings** you can choose:
- **Standard** — maximum responsiveness and full hint set.
- **Economy** — reduced load (less frequent updates, fewer overlay hints).

Use **Economy** on weaker laptops or with many open tabs.

---

### Favorites
In the opening library, click the star icon to add or remove favorites.

Favorites are stored in Chrome local storage and remain after browser restart.

---

### Important Limitations
- The extension depends on chess.com/lichess page structure. If those sites change their DOM, position detection may temporarily break.
- Opening coverage depends on the current local `.bin` book set.
- This is an opening-theory tool. Use it at your own risk and according to platform rules.

---

### FAQ
#### Hints do not appear
Check that:
1. You pressed **Launch**.
2. You are on a supported game page (not just the homepage).
3. The extension was reloaded after the latest build.

#### Why are only a few moves shown?
Most likely **Economy** mode is enabled, or rating limits are active in settings.

#### I changed code but nothing updated
1. Run `npm run build`.
2. Open `chrome://extensions`.
3. Click **Reload** on the extension.
4. Refresh the game tab.

---

### Privacy
The extension uses local data and Chrome local storage for settings and favorites.

---

### Feedback
If you found a bug or want an improvement, open an Issue in this repository.


## Русский

**Line Master** — это расширение Chrome для шахмат, которое показывает дебютные теоретические ходы во время партии, больше не нужно учить теорию.

Поддерживаемые платформы:
- chess.com

поддержка lichess.org будет добавлена позже

---

### Возможности
- Определяет текущую позицию на доске.
- Находит теоретические ходы из локальной базы дебютов.
- Показывает рекомендации в popup-окне расширения.
- Может рисовать подсказки ходов прямо на доске.
- Позволяет сохранять дебюты в избранное.
- Имеет фильтры по рейтингу и режимы производительности.
- Поддерживает интерфейс на английском и русском.

---

### Установка (режим разработчика Chrome)
> Эта версия пока не опубликована в Chrome Web Store, её скорее всего не одобрят.

1. Скачайте проект (ZIP или `git clone`).
2. Откройте папку проекта в терминале.
3. Установите зависимости:
   ```bash
   npm install
   ```
4. Соберите расширение:
   ```bash
   npm run build
   ```
5. Откройте в Chrome `chrome://extensions`.
6. Включите **Режим разработчика**.
7. Нажмите **Загрузить распакованное расширение**.
8. Выберите папку `dist` из проекта.

После изменений в коде снова запускайте `npm run build` и нажимайте **Обновить** у расширения в `chrome://extensions`.

---

### Как пользоваться
1. Откройте партию на chess.com или lichess.org.
2. Нажмите на иконку расширения.
3. На главном экране нажмите **Launch / Запустить**, чтобы включить подсказки.
4. Используйте вкладки:
   - **Openings** — библиотека дебютов,
   - **Favorites** — избранные дебюты,
   - **Settings** — язык, рейтинг, лимиты, производительность.

---

### Режимы производительности
В **Settings** можно выбрать:
- **Standard** — максимальная отзывчивость и полный набор подсказок.
- **Economy** — сниженная нагрузка (реже обновления, меньше подсказок на доске).

Используйте **Economy** на слабых ноутбуках или при большом числе открытых вкладок.

---

### Избранное
В библиотеке дебютов нажимайте на иконку звезды, чтобы добавить или убрать дебют из избранного.

Избранное хранится в локальном хранилище Chrome и сохраняется после перезапуска браузера.

---

### Важные ограничения
- Расширение зависит от структуры страниц chess.com/lichess. Если сайты изменят DOM, определение позиции может временно перестать работать.
- Покрытие дебютов зависит от текущего набора локальных `.bin` книг.
- Это инструмент по дебютной теории. Используйте на свой риск и с учетом правил платформ.

---

### FAQ
#### Подсказки не появляются
Проверьте, что:
1. Вы нажали **Launch / Запустить**.
2. Открыта поддерживаемая страница партии (а не просто главная страница сайта).
3. Расширение обновлено после последней сборки.

#### Почему показывается мало ходов?
Скорее всего включен режим **Economy** или действуют ограничения по рейтингу в настройках или это конец теоретической игры.

#### Я изменил код, но ничего не обновилось
1. Запустите `npm run build`.
2. Откройте `chrome://extensions`.
3. Нажмите **Обновить** у расширения.
4. Перезагрузите вкладку с партией.

---

### Конфиденциальность
Расширение использует локальные данные и локальное хранилище Chrome для настроек и избранного.

---

### Обратная связь
Если нашли баг или хотите улучшение, создайте Issue в этом репозитории.
