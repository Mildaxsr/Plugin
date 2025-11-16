const vscode = require('vscode');

// ===== ЯДРО ОБРАБОТКИ ТЕКСТА =====

function addComments(lines) {
    const newLines = [];
    for (const line of lines) {
        if (line.trim() === '') {
            newLines.push('#');
            continue;
        }
        if (line.replace(/^\s+/, '').startsWith('#')) {
            newLines.push(line);
        } else {
            newLines.push(`# ${line}`);
        }
    }
    return newLines;
}

function removeComments(lines) {
    const newLines = [];
    for (const line of lines) {
        if (line.trim() === '') {
            newLines.push(line);
            continue;
        }

        const leadingSpacesMatch = line.match(/^\s*/);
        const leadingSpaces = leadingSpacesMatch ? leadingSpacesMatch[0] : '';
        const stripped = line.slice(leadingSpaces.length);

        if (stripped.startsWith('#')) {
            let withoutHash = stripped.slice(1);
            if (withoutHash.startsWith(' ')) {
                withoutHash = withoutHash.slice(1);
            }
            newLines.push(leadingSpaces + withoutHash);
        } else {
            newLines.push(line);
        }
    }
    return newLines;
}

function formatComments(lines, width = 80) {
    const newLines = [];
    for (const line of lines) {
        const leadingSpacesMatch = line.match(/^\s*/);
        const leadingSpaces = leadingSpacesMatch ? leadingSpacesMatch[0] : '';
        const stripped = line.slice(leadingSpaces.length);

        if (!stripped.startsWith('#')) {
            newLines.push(line);
            continue;
        }

        let content = stripped.slice(1);
        if (content.startsWith(' ')) {
            content = content.slice(1);
        }

        const effectiveWidth = width - leadingSpaces.length - 2; // отступ + "# "
        if (effectiveWidth <= 0) {
            newLines.push(line);
            continue;
        }

        const wrappedLines = wrapText(content, effectiveWidth);
        for (const wline of wrappedLines) {
            newLines.push(leadingSpaces + '# ' + wline);
        }
    }
    return newLines;
}

function wrapText(text, maxWidth) {
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const result = [];
    let currentLine = '';

    for (const word of words) {
        if (currentLine.length === 0) {
            currentLine = word;
        } else if (currentLine.length + 1 + word.length <= maxWidth) {
            currentLine += ' ' + word;
        } else {
            result.push(currentLine);
            currentLine = word;
        }
    }

    if (currentLine.length > 0) {
        result.push(currentLine);
    }

    return result;
}

function processText(text, processor) {
    const lines = text.split(/\r?\n/);
    const newLines = processor(lines);
    return newLines.join('\n');
}

// ===== ПРИМЕНЕНИЕ К ВЫДЕЛЕНИЮ =====

function applyToSelections(editor, edit, processor) {
    const document = editor.document;

    editor.selections.forEach(selection => {
        if (selection.isEmpty) {
            return;
        }
        const selectedText = document.getText(selection);
        const newText = processor(selectedText);
        edit.replace(selection, newText);
    });
}

// ===== АКТИВАЦИЯ РАСШИРЕНИЯ =====

function activate(context) {
    console.log('Comment Formatter extension activated');

    const addCmd = vscode.commands.registerTextEditorCommand(
        'commentFormatter.addComments',
        (editor, edit) => {
            vscode.window.showInformationMessage('Add comments command executed');
            applyToSelections(editor, edit, text => processText(text, addComments));
        }
    );

    const removeCmd = vscode.commands.registerTextEditorCommand(
        'commentFormatter.removeComments',
        (editor, edit) => {
            vscode.window.showInformationMessage('Remove comments command executed');
            applyToSelections(editor, edit, text => processText(text, removeComments));
        }
    );

    const formatCmd = vscode.commands.registerTextEditorCommand(
        'commentFormatter.formatComments',
        (editor, edit) => {
            vscode.window.showInformationMessage('Format comments command executed');
            applyToSelections(editor, edit, text => processText(text, lines => formatComments(lines, 80)));
        }
    );

    context.subscriptions.push(addCmd, removeCmd, formatCmd);
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};
