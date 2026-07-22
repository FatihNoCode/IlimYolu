// Wording shared by the three surfaces an exam appears on: the builder's
// preview, the student's screen, and the printed sheet. Kept in one file so a
// question can never be phrased one way on paper and another way on screen.

// A Kur'an-aanvullen item is a verse with one word blanked and four Arabic
// candidates beneath it. What the student is supposed to *do* with that was
// never written down anywhere — obvious to the teacher who built it, not to
// the child sitting the toets. This is that missing sentence.
export function missingWordInstruction(language: 'tr' | 'nl'): string {
  return language === 'tr'
    ? 'Eksik kelimeyi seçin.'
    : 'Selecteer het ontbrekende woord.';
}

// Filename for a downloaded/printed exam: "Arabisch lezen toets.pdf".
//
// Browsers name a print-to-PDF after document.title, which is otherwise the
// app's own title — so every exam a teacher saved landed in Downloads as
// "Rahman Eğitim.pdf" and the second one as "Rahman Eğitim (1).pdf". The word
// follows the exam's language, not the interface's: a Turkish toets is a
// sınav even when the teacher is working in Dutch.
export function examDocumentTitle(exam: { name: string; language: 'tr' | 'nl' }): string {
  const word = exam.language === 'tr' ? 'sınav' : 'toets';
  const name = (exam.name || '').trim();
  if (!name) return word.charAt(0).toUpperCase() + word.slice(1);
  // Don't say it twice — a teacher who already called it "Rekentoets" or
  // "Arapça sınav" shouldn't get "Rekentoets toets".
  if (fold(name).includes(fold(word))) return name;
  return `${name} ${word}`;
}

const fold = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
