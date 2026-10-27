// The study panel over the board, one page at a time.
// Reading it pauses the game, closing it resumes the game if it was running.
const studyPanel = document.getElementById('study_panel');
const studyPages = [...studyPanel.querySelectorAll('.study_page')];
let studyPageIndex = 0;
let resumeAfterStudy = false;

function showStudyPage(index) {
  studyPageIndex = index;
  studyPages.forEach((page, i) => {
    page.hidden = i !== index;
  });
  document.getElementById('study_page_number').textContent = `${index + 1} / ${studyPages.length}`;
  document.getElementById('study_previous').disabled = index === 0;
  document.getElementById('study_next').disabled = index === studyPages.length - 1;
}

function openStudy() {
  resumeAfterStudy = gameLoop !== false;
  stopLoop();
  studyPanel.hidden = false;
  showStudyPage(studyPageIndex);
}

function closeStudy() {
  studyPanel.hidden = true;
  if (resumeAfterStudy) {
    startLoop();
  }
}

document.getElementById('study_button').addEventListener('click', function() {
  if (studyPanel.hidden) {
    openStudy();
  } else {
    closeStudy();
  }
});
document.getElementById('study_close').addEventListener('click', closeStudy);
document.getElementById('study_previous').addEventListener('click', () => showStudyPage(studyPageIndex - 1));
document.getElementById('study_next').addEventListener('click', () => showStudyPage(studyPageIndex + 1));
