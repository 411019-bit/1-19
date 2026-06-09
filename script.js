const studySection = document.getElementById('studySection');
const manageSection = document.getElementById('manageSection');
const showStudyBtn = document.getElementById('showStudyBtn');
const showManageBtn = document.getElementById('showManageBtn');
const wordCard = document.getElementById('wordCard');
const flipBtn = document.getElementById('flipBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const wordText = document.getElementById('wordText');
const wordTranslation = document.getElementById('wordTranslation');
const wordPartOfSpeech = document.getElementById('wordPartOfSpeech');
const wordExample = document.getElementById('wordExample');
const wordRoot = document.getElementById('wordRoot');
const wordCount = document.getElementById('wordCount');
const currentIndex = document.getElementById('currentIndex');
const totalCount = document.getElementById('totalCount');
const wordList = document.getElementById('wordList');
const newWordToggle = document.getElementById('newWordToggle');
const wordForm = document.getElementById('wordForm');
const englishInput = document.getElementById('englishInput');
const translateInput = document.getElementById('translateInput');
const posInput = document.getElementById('posInput');
const exampleInput = document.getElementById('exampleInput');
const rootInput = document.getElementById('rootInput');
const autoFillBtn = document.getElementById('autoFillBtn');
const apiStatus = document.getElementById('apiStatus');

let deck = [];
let currentCardIndex = 0;
let isFlipped = false;

function loadDeck() {
  const saved = localStorage.getItem('wordDeck');
  deck = saved ? JSON.parse(saved) : [];
}

function saveDeck() {
  localStorage.setItem('wordDeck', JSON.stringify(deck));
}

function updateStudyStats() {
  wordCount.textContent = deck.length;
  totalCount.textContent = deck.length;
  currentIndex.textContent = deck.length ? currentCardIndex + 1 : 0;
}

function renderStudyCard() {
  if (!deck.length) {
    wordText.textContent = '請先新增單字';
    wordTranslation.textContent = '請至管理頁新增內容。';
    wordPartOfSpeech.textContent = '—';
    wordExample.textContent = '—';
    wordRoot.textContent = '—';
    wordCard.classList.remove('flipped');
    isFlipped = false;
    return;
  }

  const card = deck[currentCardIndex];
  wordText.textContent = card.word;
  wordTranslation.textContent = card.translation || '尚未填入翻譯';
  wordPartOfSpeech.textContent = card.partOfSpeech || '尚未填入詞性';
  wordExample.textContent = card.example || '尚未填入例句';
  wordRoot.textContent = card.rootAnalysis || '尚未填入字根分析';
  if (isFlipped) {
    wordCard.classList.add('flipped');
  } else {
    wordCard.classList.remove('flipped');
  }
}

function renderWordList() {
  wordList.innerHTML = deck.map((entry, index) => {
    return `
      <div class="word-card">
        <div class="word-card-info">
          <strong>${entry.word}</strong>
          <p>翻譯：${entry.translation || '尚未填入'}</p>
          <p>詞性：${entry.partOfSpeech || '尚未填入'}</p>
        </div>
        <div class="word-card-actions">
          <button type="button" data-index="${index}" class="secondary edit-btn">編輯</button>
          <button type="button" data-index="${index}" class="secondary danger delete-btn">刪除</button>
        </div>
      </div>
    `;
  }).join('');

  if (!deck.length) {
    wordList.innerHTML = '<p style="color: var(--muted);">目前尚無單字，請新增一筆資料。</p>';
  }
}

function showSection(section) {
  if (section === 'study') {
    studySection.classList.add('active');
    manageSection.classList.remove('active');
    showStudyBtn.classList.add('active');
    showManageBtn.classList.remove('active');
  } else {
    studySection.classList.remove('active');
    manageSection.classList.add('active');
    showStudyBtn.classList.remove('active');
    showManageBtn.classList.add('active');
  }
}

function resetFormState() {
  apiStatus.textContent = '';
}

function clearForm() {
  englishInput.value = '';
  translateInput.value = '';
  posInput.value = '';
  exampleInput.value = '';
  rootInput.value = '';
  resetFormState();
}

function toggleForm() {
  wordForm.classList.toggle('hidden');
  if (!wordForm.classList.contains('hidden')) {
    clearForm();
    englishInput.focus();
  }
}

function addWord(entry) {
  deck.push(entry);
  saveDeck();
  renderWordList();
  updateStudyStats();
  renderStudyCard();
}

function deleteWord(index) {
  deck.splice(index, 1);
  if (currentCardIndex >= deck.length) {
    currentCardIndex = Math.max(0, deck.length - 1);
  }
  saveDeck();
  renderWordList();
  updateStudyStats();
  renderStudyCard();
}

function editWord(index) {
  const entry = deck[index];
  if (!entry) return;
  showSection('manage');
  if (wordForm.classList.contains('hidden')) {
    wordForm.classList.remove('hidden');
  }
  englishInput.value = entry.word;
  translateInput.value = entry.translation;
  posInput.value = entry.partOfSpeech;
  exampleInput.value = entry.example;
  rootInput.value = entry.rootAnalysis;
  wordForm.dataset.editIndex = index;
  englishInput.focus();
}

async function fetchDictionaryData(word) {
  const definitionUrl = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`;
  const translationUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=en|zh-TW`;

  apiStatus.textContent = '正在自動填入中，請稍候…';
  try {
    const [defResp, transResp] = await Promise.all([
      fetch(definitionUrl),
      fetch(translationUrl)
    ]);

    let translation = '';
    if (transResp.ok) {
      const transJson = await transResp.json();
      translation = transJson.responseData?.translatedText || '';
    }

    if (!defResp.ok) {
      apiStatus.textContent = '找不到這個單字的字典資料，請手動補齊。';
      return { translation, partOfSpeech: '', example: '', rootAnalysis: '' };
    }

    const defJson = await defResp.json();
    const firstEntry = Array.isArray(defJson) ? defJson[0] : defJson;
    const meanings = firstEntry.meanings || [];
    const firstMeaning = meanings[0] || {};
    const partOfSpeech = firstMeaning.partOfSpeech || '';
    const definition = firstMeaning.definitions?.[0] || {};
    const example = definition.example || '';
    const rootAnalysis = firstEntry.origin || '';

    apiStatus.textContent = '自動填入完成，您可以繼續修改後保存。';
    return {
      translation,
      partOfSpeech,
      example,
      rootAnalysis
    };
  } catch (error) {
    apiStatus.textContent = '自動填入時發生錯誤，請稍後再試。';
    return { translation: '', partOfSpeech: '', example: '', rootAnalysis: '' };
  }
}

function updateCardDisplay() {
  if (isFlipped) {
    wordCard.classList.add('flipped');
  } else {
    wordCard.classList.remove('flipped');
  }
}

function initEventListeners() {
  showStudyBtn.addEventListener('click', () => showSection('study'));
  showManageBtn.addEventListener('click', () => showSection('manage'));

  wordCard.addEventListener('click', () => {
    isFlipped = !isFlipped;
    updateCardDisplay();
  });

  wordCard.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      isFlipped = !isFlipped;
      updateCardDisplay();
    }
  });

  flipBtn.addEventListener('click', () => {
    isFlipped = !isFlipped;
    updateCardDisplay();
  });

  prevBtn.addEventListener('click', () => {
    if (!deck.length) return;
    currentCardIndex = (currentCardIndex - 1 + deck.length) % deck.length;
    isFlipped = false;
    updateStudyStats();
    renderStudyCard();
  });

  nextBtn.addEventListener('click', () => {
    if (!deck.length) return;
    currentCardIndex = (currentCardIndex + 1) % deck.length;
    isFlipped = false;
    updateStudyStats();
    renderStudyCard();
  });

  newWordToggle.addEventListener('click', toggleForm);

  wordForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const word = englishInput.value.trim();
    if (!word) return;
    const entry = {
      word,
      translation: translateInput.value.trim(),
      partOfSpeech: posInput.value.trim(),
      example: exampleInput.value.trim(),
      rootAnalysis: rootInput.value.trim()
    };

    const editIndex = wordForm.dataset.editIndex;
    if (editIndex !== undefined) {
      deck[Number(editIndex)] = entry;
      delete wordForm.dataset.editIndex;
    } else {
      addWord(entry);
    }
    saveDeck();
    renderWordList();
    updateStudyStats();
    renderStudyCard();
    toggleForm();
  });

  autoFillBtn.addEventListener('click', async () => {
    const word = englishInput.value.trim();
    if (!word) {
      apiStatus.textContent = '請先輸入英文單字，再使用自動填入。';
      return;
    }
    autoFillBtn.disabled = true;
    autoFillBtn.textContent = '自動填入中…';
    const result = await fetchDictionaryData(word);
    translateInput.value = result.translation || translateInput.value;
    posInput.value = result.partOfSpeech || posInput.value;
    exampleInput.value = result.example || exampleInput.value;
    rootInput.value = result.rootAnalysis || rootInput.value;
    autoFillBtn.disabled = false;
    autoFillBtn.textContent = '自動填入';
  });

  wordList.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    const index = Number(button.dataset.index);
    if (button.classList.contains('delete-btn')) {
      deleteWord(index);
    }
    if (button.classList.contains('edit-btn')) {
      editWord(index);
    }
  });
}

function init() {
  loadDeck();
  renderStudyCard();
  renderWordList();
  updateStudyStats();
  initEventListeners();
}

init();
