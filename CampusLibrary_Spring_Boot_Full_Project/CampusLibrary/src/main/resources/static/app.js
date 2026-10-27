'use strict';

// The page is served by Spring Boot, so use the same-origin GraphQL endpoint.
const GRAPHQL_URL = '/graphql';

const AUTHORS_QUERY = `
    query CampusAuthors {
        authors {
            id
            name
            country
            books {
                id
                title
                year
            }
        }
    }
`;

const ADD_BOOK_MUTATION = `
    mutation AddBook($title: String!, $year: Int, $authorId: ID!) {
        addBook(title: $title, year: $year, authorId: $authorId) {
            id
            title
            year
            author {
                id
                name
            }
        }
    }
`;

const authorList = document.querySelector('#authorList');
const authorCount = document.querySelector('#authorCount');
const bookCount = document.querySelector('#bookCount');
const statusMessage = document.querySelector('#statusMessage');
const refreshButton = document.querySelector('#refreshButton');
const addBookForm = document.querySelector('#addBookForm');
const titleInput = document.querySelector('#title');
const yearInput = document.querySelector('#year');
const authorSelect = document.querySelector('#authorId');
const submitButton = document.querySelector('#submitButton');

async function graphqlRequest(query, variables = {}) {
    const response = await fetch(GRAPHQL_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables })
    });

    let payload;
    try {
        payload = await response.json();
    } catch {
        throw new Error(`The server returned an unreadable response (HTTP ${response.status}).`);
    }

    if (!response.ok) {
        throw new Error(`Request failed with HTTP ${response.status}.`);
    }

    if (payload.errors?.length) {
        throw new Error(payload.errors.map(error => error.message).join(' '));
    }

    if (!payload.data) {
        throw new Error('The GraphQL response did not contain data.');
    }

    return payload.data;
}

function showStatus(message, type = 'info') {
    statusMessage.textContent = message;
    statusMessage.dataset.type = type;
    statusMessage.hidden = !message;
}

function makeElement(tagName, className, text) {
    const element = document.createElement(tagName);
    if (className) element.className = className;
    if (text !== undefined && text !== null) element.textContent = String(text);
    return element;
}

function updateAuthorSelect(authors) {
    const previousValue = authorSelect.value;
    authorSelect.replaceChildren(new Option('Choose an author…', ''));

    for (const author of authors) {
        authorSelect.add(new Option(author.name, String(author.id)));
    }

    if (authors.some(author => String(author.id) === previousValue)) {
        authorSelect.value = previousValue;
    }

    authorSelect.disabled = authors.length === 0;
    if (authors.length === 0) {
        authorSelect.replaceChildren(new Option('No authors available', ''));
    }
}

function renderAuthors(authors) {
    authorList.replaceChildren();
    authorList.setAttribute('aria-busy', 'false');

    if (authors.length === 0) {
        const emptyCard = makeElement('div', 'empty-card');
        emptyCard.append(
            makeElement('strong', '', 'No authors found'),
            makeElement('p', '', 'The API returned no authors. Add sample data in MySQL, then refresh this page.')
        );
        authorList.append(emptyCard);
        return;
    }

    for (const author of authors) {
        const books = Array.isArray(author.books) ? author.books : [];
        const card = makeElement('article', 'author-card');
        const header = makeElement('div', 'author-card-header');
        const identity = makeElement('div', '');
        identity.append(
            makeElement('h3', 'author-name', author.name),
            makeElement('p', 'author-country', author.country || 'Country not specified')
        );
        const badge = makeElement('span', 'book-count', `${books.length} ${books.length === 1 ? 'book' : 'books'}`);
        header.append(identity, badge);
        card.append(header);

        if (books.length > 0) {
            const list = makeElement('ul', 'book-list');
            for (const book of books) {
                const item = makeElement('li', 'book-item');
                item.append(makeElement('span', '', book.title));
                item.append(makeElement('span', 'book-year', book.year ?? 'Year n/a'));
                list.append(item);
            }
            card.append(list);
        } else {
            card.append(makeElement('p', 'no-books', 'No books listed for this author yet.'));
        }

        authorList.append(card);
    }
}

async function loadAuthors({ announce = false } = {}) {
    refreshButton.disabled = true;
    authorList.setAttribute('aria-busy', 'true');
    authorList.replaceChildren();
    const loading = makeElement('div', 'loading-card');
    loading.append(makeElement('span', 'spinner'), document.createTextNode('Loading authors and books…'));
    authorList.append(loading);

    try {
        const data = await graphqlRequest(AUTHORS_QUERY);
        const authors = data.authors ?? [];
        renderAuthors(authors);
        updateAuthorSelect(authors);
        authorCount.textContent = String(authors.length);
        bookCount.textContent = String(authors.reduce((total, author) => total + (author.books?.length ?? 0), 0));
        if (announce) showStatus('The author and book list has been refreshed.', 'success');
    } catch (error) {
        authorList.setAttribute('aria-busy', 'false');
        authorList.replaceChildren();
        const errorCard = makeElement('div', 'empty-card');
        errorCard.append(
            makeElement('strong', '', 'Could not load the library'),
            makeElement('p', '', `${error.message} Make sure CampusEats is running and the database is available, then try refreshing.`)
        );
        authorList.append(errorCard);
        authorCount.textContent = '—';
        bookCount.textContent = '—';
        updateAuthorSelect([]);
        showStatus('Unable to load data from the GraphQL API.', 'error');
    } finally {
        refreshButton.disabled = false;
    }
}

refreshButton.addEventListener('click', () => loadAuthors({ announce: true }));

addBookForm.addEventListener('submit', async event => {
    event.preventDefault();

    const title = titleInput.value.trim();
    const authorId = authorSelect.value;
    const yearText = yearInput.value.trim();
    const year = yearText === '' ? null : Number(yearText);

    if (!title) {
        showStatus('Please enter a book title.', 'error');
        titleInput.focus();
        return;
    }
    if (!authorId) {
        showStatus('Please choose an author.', 'error');
        authorSelect.focus();
        return;
    }
    if (year !== null && (!Number.isInteger(year) || year < 0 || year > 9999)) {
        showStatus('Enter a valid publication year, or leave the field empty.', 'error');
        yearInput.focus();
        return;
    }

    submitButton.disabled = true;
    submitButton.textContent = 'Adding book…';

    try {
        const data = await graphqlRequest(ADD_BOOK_MUTATION, {
            title,
            year,
            authorId: String(authorId)
        });

        const addedBook = data.addBook;
        addBookForm.reset();
        await loadAuthors();
        showStatus(`Added “${addedBook.title}”${addedBook.author?.name ? ` by ${addedBook.author.name}` : ''}. The library has been updated.`, 'success');
    } catch (error) {
        showStatus(`Could not add the book: ${error.message}`, 'error');
    } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = '<span aria-hidden="true">＋</span> Add book';
    }
});

loadAuthors();
