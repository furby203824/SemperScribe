
export interface ParagraphContext {
  level: 'none' | 'main' | 'sub' | 'subsub' | 'subsubsub';
  main: number;
  sub: string | null;
  subsub: number | null;
  subsubsub: string | null;
}

export function parseLastParagraph(textBeforeCursor: string): ParagraphContext {
  const lines = textBeforeCursor.split('\n');

  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim();

    // 1.A.1.A.
    const subsubsubMatch = line.match(/^(\d+)\.([A-Z])\.(\d+)\.([A-Z])\.\s?/);
    if (subsubsubMatch) {
      return {
        level: 'subsubsub',
        main: parseInt(subsubsubMatch[1]),
        sub: subsubsubMatch[2],
        subsub: parseInt(subsubsubMatch[3]),
        subsubsub: subsubsubMatch[4],
      };
    }

    // 1.A.1.
    const subsubMatch = line.match(/^(\d+)\.([A-Z])\.(\d+)\.\s?/);
    if (subsubMatch) {
      return {
        level: 'subsub',
        main: parseInt(subsubMatch[1]),
        sub: subsubMatch[2],
        subsub: parseInt(subsubMatch[3]),
        subsubsub: null,
      };
    }

    // 1.A.
    const subMatch = line.match(/^(\d+)\.([A-Z])\.\s?/);
    if (subMatch) {
      return {
        level: 'sub',
        main: parseInt(subMatch[1]),
        sub: subMatch[2],
        subsub: null,
        subsubsub: null,
      };
    }

    // 1.
    const mainMatch = line.match(/^(\d+)\.\s?/);
    if (mainMatch) {
      return {
        level: 'main',
        main: parseInt(mainMatch[1]),
        sub: null,
        subsub: null,
        subsubsub: null,
      };
    }
  }

  return { level: 'none', main: 0, sub: null, subsub: null, subsubsub: null };
}

export function getNextParagraphString(
  type: 'main' | 'sub-a' | 'sub-1' | 'sub-a2',
  textBeforeCursor: string
): string {
  const context = parseLastParagraph(textBeforeCursor);
  let insert = '';

  if (type === 'main') {
    const nextMain = context.main + 1;
    insert = '\n' + nextMain + '. ';
  } else if (type === 'sub-a') {
    if (context.level === 'none' || context.level === 'main') {
      const mainNum = context.main || 1;
      insert = '\n' + mainNum + '.A. ';
    } else if (context.level === 'sub') {
      const nextLetter = String.fromCharCode(context.sub!.charCodeAt(0) + 1);
      insert = '\n' + context.main + '.' + nextLetter + '. ';
    } else if (context.level === 'subsub' || context.level === 'subsubsub') {
      const nextLetter = String.fromCharCode(context.sub!.charCodeAt(0) + 1);
      insert = '\n' + context.main + '.' + nextLetter + '. ';
    }
  } else if (type === 'sub-1') {
    if (context.level === 'sub') {
      insert = '\n' + context.main + '.' + context.sub + '.1. ';
    } else if (context.level === 'subsub') {
      const nextNum = (context.subsub || 0) + 1;
      insert = '\n' + context.main + '.' + context.sub + '.' + nextNum + '. ';
    } else if (context.level === 'subsubsub') {
        const nextNum = (context.subsub || 0) + 1;
        insert = '\n' + context.main + '.' + context.sub + '.' + nextNum + '. ';
    } else {
      insert = '\n1.A.1. ';
    }
  } else if (type === 'sub-a2') {
    if (context.level === 'subsub') {
      insert = '\n' + context.main + '.' + context.sub + '.' + context.subsub + '.A. ';
    } else if (context.level === 'subsubsub') {
      const nextLetter = String.fromCharCode(context.subsubsub!.charCodeAt(0) + 1);
      insert =
        '\n' +
        context.main +
        '.' +
        context.sub +
        '.' +
        context.subsub +
        '.' +
        nextLetter +
        '. ';
    } else {
      insert = '\n1.A.1.A. ';
    }
  }

  return insert;
}
