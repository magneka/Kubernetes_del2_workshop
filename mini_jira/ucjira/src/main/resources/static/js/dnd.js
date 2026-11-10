// Drag and drop used by the board (cards between status columns) and the backlog (issues between sprints).
//
// Markup contract:
//   [data-dnd-root]   container that is re-rendered from the server after a move; its data-dnd-from is sent as "from"
//   [data-move-url]   draggable item; a move is POSTed to this URL
//   [data-drop-name]  drop zone; sends <data-drop-name>=<data-drop-value>, e.g. status=DONE or sprintId=3
//
// The move is shown immediately, then saved. The endpoint redirects back to the page, so the response
// is the updated page and the root is swapped with the server's version (correct sorting, counts, totals).
(function () {
    let dragged = null;

    document.addEventListener('dragstart', e => {
        const item = e.target.closest && e.target.closest('[data-move-url]');
        if (!item) return;
        dragged = item;
        item.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', item.dataset.key || '');
    });

    document.addEventListener('dragend', () => {
        if (dragged) dragged.classList.remove('dragging');
        dragged = null;
        clearHighlight();
    });

    document.addEventListener('dragover', e => {
        const zone = dropZone(e);
        if (!zone) return;
        e.preventDefault(); // allow drop
        e.dataTransfer.dropEffect = 'move';
        clearHighlight();
        zone.classList.add('drop-target');
    });

    document.addEventListener('drop', e => {
        const zone = dropZone(e);
        if (!zone) return;
        e.preventDefault();
        const item = dragged;
        clearHighlight();
        if (item.closest('[data-drop-name]') === zone) return;

        (zone.querySelector('.drop-list') || zone).appendChild(item); // optimistic move
        move(item.dataset.moveUrl, zone.dataset.dropName, zone.dataset.dropValue);
    });

    function dropZone(e) {
        return dragged && e.target.closest ? e.target.closest('[data-drop-name]') : null;
    }

    function clearHighlight() {
        document.querySelectorAll('.drop-target').forEach(z => z.classList.remove('drop-target'));
    }

    async function move(url, name, value) {
        const root = document.querySelector('[data-dnd-root]');
        const body = new URLSearchParams({
            [name]: value,
            from: root.dataset.dndFrom,
            _csrf: document.querySelector('input[name="_csrf"]').value,
        });
        try {
            const response = await fetch(url, { method: 'POST', body: body });
            if (!response.ok || response.url.includes('/login')) throw new Error('Move failed: ' + response.status);
            const page = new DOMParser().parseFromString(await response.text(), 'text/html');
            root.replaceWith(page.querySelector('[data-dnd-root]'));
            document.querySelector('.footer').replaceWith(page.querySelector('.footer'));
        } catch (err) {
            console.error(err);
            location.reload(); // show the real state
        }
    }
})();
