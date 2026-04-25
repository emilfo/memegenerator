const root = document.querySelector('#meme-editor');

if (!root) {
	throw new Error('Meme editor root not found.');
}

const templates = JSON.parse(root.dataset.templates ?? '[]');
const defaultImage = root.dataset.defaultImage ?? templates[0]?.src ?? '';

const refs = {
	stage: document.querySelector('#editor-stage'),
	image: document.querySelector('#editor-image'),
	textLayer: document.querySelector('#text-layer'),
	imageName: document.querySelector('#active-image-name'),
	templateButtons: [...document.querySelectorAll('.template-card')],
	uploadInput: document.querySelector('#image-upload'),
	addTextButton: document.querySelector('#add-text-box'),
	downloadButton: document.querySelector('#download-meme'),
	emptySelection: document.querySelector('#empty-selection'),
	captionForm: document.querySelector('#caption-form'),
	textInput: document.querySelector('#text-input'),
	alignInput: document.querySelector('#align-input'),
	fontSizeInput: document.querySelector('#font-size-input'),
	fontSizeValue: document.querySelector('#font-size-value'),
	widthInput: document.querySelector('#width-input'),
	widthValue: document.querySelector('#width-value'),
	heightInput: document.querySelector('#height-input'),
	heightValue: document.querySelector('#height-value'),
	xInput: document.querySelector('#x-input'),
	xValue: document.querySelector('#x-value'),
	yInput: document.querySelector('#y-input'),
	yValue: document.querySelector('#y-value'),
	duplicateButton: document.querySelector('#duplicate-text-box'),
	deleteButton: document.querySelector('#delete-text-box')
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const createDefaultBoxes = () => [
	{
		id: crypto.randomUUID(),
		text: 'TOP TEXT',
		x: 8,
		y: 4,
		width: 84,
		height: 16,
		fontSize: 62,
		align: 'center'
	},
	{
		id: crypto.randomUUID(),
		text: 'BOTTOM TEXT',
		x: 8,
		y: 79,
		width: 84,
		height: 16,
		fontSize: 62,
		align: 'center'
	}
];

const state = {
	image: {
		src: defaultImage,
		name: templates[0]?.name ?? 'Custom image',
		fileUrl: null,
		naturalWidth: 1,
		naturalHeight: 1
	},
	boxes: createDefaultBoxes(),
	selectedId: null,
	interaction: null
};

state.selectedId = state.boxes[0]?.id ?? null;

const getSelectedBox = () => state.boxes.find((box) => box.id === state.selectedId) ?? null;

const setSelectedBox = (id) => {
	state.selectedId = id;
	renderBoxes();
	renderForm();
};

const updateStageAspectRatio = () => {
	refs.stage.style.aspectRatio = `${state.image.naturalWidth} / ${state.image.naturalHeight}`;
};

const renderTemplateSelection = () => {
	refs.templateButtons.forEach((button) => {
		const active = button.dataset.templateSrc === state.image.src;
		button.classList.toggle('is-active', active);
	});
	refs.imageName.textContent = state.image.name;
};

const renderBoxes = () => {
	refs.textLayer.innerHTML = '';

	state.boxes.forEach((box) => {
		const element = document.createElement('div');
		element.className = `meme-box${box.id === state.selectedId ? ' is-selected' : ''}`;
		element.dataset.id = box.id;
		element.style.left = `${box.x}%`;
		element.style.top = `${box.y}%`;
		element.style.width = `${box.width}%`;
		element.style.height = `${box.height}%`;

		const dragHandle = document.createElement('button');
		dragHandle.type = 'button';
		dragHandle.className = 'meme-box__drag';
		dragHandle.dataset.action = 'drag';
		dragHandle.dataset.id = box.id;
		dragHandle.style.fontSize = `${box.fontSize}px`;
		dragHandle.style.justifyContent =
			box.align === 'left' ? 'flex-start' : box.align === 'right' ? 'flex-end' : 'center';
		dragHandle.style.textAlign = box.align;
		dragHandle.textContent = box.text || 'TEXT';

		const resizeHandle = document.createElement('button');
		resizeHandle.type = 'button';
		resizeHandle.className = 'meme-box__resize';
		resizeHandle.dataset.action = 'resize';
		resizeHandle.dataset.id = box.id;
		resizeHandle.setAttribute('aria-label', 'Resize text box');

		element.append(dragHandle, resizeHandle);
		refs.textLayer.append(element);
	});
};

const updateValueLabels = (box) => {
	refs.fontSizeValue.textContent = `${box.fontSize}px`;
	refs.widthValue.textContent = `${box.width}%`;
	refs.heightValue.textContent = `${box.height}%`;
	refs.xValue.textContent = `${box.x}%`;
	refs.yValue.textContent = `${box.y}%`;
};

const renderForm = () => {
	const box = getSelectedBox();
	const hasBox = Boolean(box);

	refs.emptySelection.classList.toggle('hidden', hasBox);
	refs.captionForm.classList.toggle('hidden', !hasBox);
	refs.captionForm.classList.toggle('flex', hasBox);

	if (!box) {
		return;
	}

	refs.textInput.value = box.text;
	refs.alignInput.value = box.align;
	refs.fontSizeInput.value = String(box.fontSize);
	refs.widthInput.value = String(box.width);
	refs.heightInput.value = String(box.height);
	refs.xInput.value = String(Math.round(box.x));
	refs.yInput.value = String(Math.round(box.y));
	refs.deleteButton.disabled = state.boxes.length <= 1;
	updateValueLabels(box);
};

const updateBox = (id, patch) => {
	state.boxes = state.boxes.map((box) => (box.id === id ? { ...box, ...patch } : box));
	renderBoxes();
	renderForm();
};

const startInteraction = (event, id, action) => {
	const stageRect = refs.stage.getBoundingClientRect();
	const box = state.boxes.find((item) => item.id === id);

	if (!box) {
		return;
	}

	state.interaction = {
		id,
		action,
		startX: event.clientX,
		startY: event.clientY,
		stageWidth: stageRect.width,
		stageHeight: stageRect.height,
		initial: { ...box }
	};

	setSelectedBox(id);
	event.target.setPointerCapture?.(event.pointerId);
	event.preventDefault();
};

const handlePointerMove = (event) => {
	if (!state.interaction) {
		return;
	}

	const { id, action, startX, startY, stageWidth, stageHeight, initial } = state.interaction;
	const deltaX = ((event.clientX - startX) / stageWidth) * 100;
	const deltaY = ((event.clientY - startY) / stageHeight) * 100;

	if (action === 'drag') {
		updateBox(id, {
			x: clamp(Number((initial.x + deltaX).toFixed(2)), 0, 100 - initial.width),
			y: clamp(Number((initial.y + deltaY).toFixed(2)), 0, 100 - initial.height)
		});
		return;
	}

	updateBox(id, {
		width: clamp(Number((initial.width + deltaX).toFixed(2)), 12, 100 - initial.x),
		height: clamp(Number((initial.height + deltaY).toFixed(2)), 8, 100 - initial.y)
	});
};

const stopInteraction = () => {
	state.interaction = null;
};

const syncImageMetrics = () => {
	state.image.naturalWidth = refs.image.naturalWidth || 1;
	state.image.naturalHeight = refs.image.naturalHeight || 1;
	updateStageAspectRatio();
	refs.textLayer.style.width = '100%';
	refs.textLayer.style.height = '100%';
};

const loadImage = (src, name, fileUrl = null) => {
	if (state.image.fileUrl && state.image.fileUrl !== fileUrl) {
		URL.revokeObjectURL(state.image.fileUrl);
	}

	state.image = {
		...state.image,
		src,
		name,
		fileUrl
	};

	refs.image.src = src;
	refs.image.alt = name;
	renderTemplateSelection();
};

const addTextBox = (box = null) => {
	const nextBox = box ?? {
		id: crypto.randomUUID(),
		text: 'NEW TEXT',
		x: 18,
		y: 18,
		width: 64,
		height: 16,
		fontSize: 54,
		align: 'center'
	};

	state.boxes = [...state.boxes, nextBox];
	setSelectedBox(nextBox.id);
};

const duplicateSelectedBox = () => {
	const selected = getSelectedBox();

	if (!selected) {
		return;
	}

	addTextBox({
		...selected,
		id: crypto.randomUUID(),
		x: clamp(selected.x + 4, 0, 100 - selected.width),
		y: clamp(selected.y + 4, 0, 100 - selected.height)
	});
};

const deleteSelectedBox = () => {
	if (state.boxes.length <= 1 || !state.selectedId) {
		return;
	}

	state.boxes = state.boxes.filter((box) => box.id !== state.selectedId);
	state.selectedId = state.boxes[0]?.id ?? null;
	renderBoxes();
	renderForm();
};

const fitTextLines = (context, text, maxWidth) => {
	const paragraphs = text.toUpperCase().split('\n');
	const lines = [];

	paragraphs.forEach((paragraph) => {
		const words = paragraph.split(/\s+/).filter(Boolean);

		if (!words.length) {
			lines.push('');
			return;
		}

		let currentLine = words.shift() ?? '';

		words.forEach((word) => {
			const candidate = `${currentLine} ${word}`;
			if (context.measureText(candidate).width <= maxWidth) {
				currentLine = candidate;
			} else {
				lines.push(currentLine);
				currentLine = word;
			}
		});

		lines.push(currentLine);
	});

	return lines;
};

const exportMeme = async () => {
	const image = new Image();
	image.src = state.image.src;
	await image.decode();

	const canvas = document.createElement('canvas');
	canvas.width = image.naturalWidth;
	canvas.height = image.naturalHeight;

	const context = canvas.getContext('2d');
	if (!context) {
		return;
	}

	context.drawImage(image, 0, 0);
	context.textBaseline = 'middle';
	context.fillStyle = '#ffffff';
	context.strokeStyle = '#000000';
	context.lineJoin = 'round';

	state.boxes.forEach((box) => {
		const x = (box.x / 100) * canvas.width;
		const y = (box.y / 100) * canvas.height;
		const width = (box.width / 100) * canvas.width;
		const height = (box.height / 100) * canvas.height;
		const fontSize = box.fontSize * (canvas.width / refs.stage.clientWidth);

		context.font = `900 ${fontSize}px Impact, Haettenschweiler, "Arial Narrow Bold", sans-serif`;
		context.textAlign = box.align;
		context.lineWidth = Math.max(4, fontSize * 0.12);

		const lines = fitTextLines(context, box.text || 'TEXT', width);
		const lineHeight = fontSize * 0.95;
		const blockHeight = Math.max(lineHeight, lines.length * lineHeight);
		const startY = y + (height - blockHeight) / 2 + lineHeight / 2;
		const textX =
			box.align === 'left' ? x : box.align === 'right' ? x + width : x + width / 2;

		lines.forEach((line, index) => {
			const textY = startY + index * lineHeight;
			context.strokeText(line, textX, textY, width);
			context.fillText(line, textX, textY, width);
		});
	});

	const link = document.createElement('a');
	link.href = canvas.toDataURL('image/png');
	link.download = 'meme.png';
	link.click();
};

refs.textLayer.addEventListener('pointerdown', (event) => {
	const target = event.target.closest('[data-action]');
	if (!target) {
		return;
	}

	startInteraction(event, target.dataset.id, target.dataset.action);
});

refs.textLayer.addEventListener('click', (event) => {
	const target = event.target.closest('[data-id]');
	if (!target) {
		return;
	}

	setSelectedBox(target.dataset.id);
});

window.addEventListener('pointermove', handlePointerMove);
window.addEventListener('pointerup', stopInteraction);
window.addEventListener('pointercancel', stopInteraction);

refs.templateButtons.forEach((button) => {
	button.addEventListener('click', () => {
		loadImage(button.dataset.templateSrc, button.querySelector('p')?.textContent?.trim() ?? 'Template');
	});
});

refs.uploadInput.addEventListener('change', (event) => {
	const file = event.currentTarget.files?.[0];
	if (!file) {
		return;
	}

	const fileUrl = URL.createObjectURL(file);
	loadImage(fileUrl, file.name, fileUrl);
	refs.uploadInput.value = '';
});

refs.addTextButton.addEventListener('click', () => addTextBox());
refs.duplicateButton.addEventListener('click', duplicateSelectedBox);
refs.deleteButton.addEventListener('click', deleteSelectedBox);
refs.downloadButton.addEventListener('click', () => {
	exportMeme().catch((error) => {
		console.error(error);
		window.alert('Could not export the meme image.');
	});
});

refs.textInput.addEventListener('input', (event) => {
	if (!state.selectedId) {
		return;
	}
	updateBox(state.selectedId, { text: event.currentTarget.value });
});

refs.alignInput.addEventListener('change', (event) => {
	if (!state.selectedId) {
		return;
	}
	updateBox(state.selectedId, { align: event.currentTarget.value });
});

[
	[refs.fontSizeInput, 'fontSize'],
	[refs.widthInput, 'width'],
	[refs.heightInput, 'height'],
	[refs.xInput, 'x'],
	[refs.yInput, 'y']
].forEach(([input, key]) => {
	input.addEventListener('input', (event) => {
		if (!state.selectedId) {
			return;
		}

		const selected = getSelectedBox();
		if (!selected) {
			return;
		}

		const value = Number(event.currentTarget.value);
		const patch = { [key]: value };

		if (key === 'x') {
			patch.x = clamp(value, 0, 100 - selected.width);
		}

		if (key === 'y') {
			patch.y = clamp(value, 0, 100 - selected.height);
		}

		if (key === 'width') {
			patch.width = clamp(value, 12, 100 - selected.x);
		}

		if (key === 'height') {
			patch.height = clamp(value, 8, 100 - selected.y);
		}

		updateBox(state.selectedId, patch);
	});
});

refs.image.addEventListener('load', () => {
	syncImageMetrics();
	renderTemplateSelection();
});

window.addEventListener('beforeunload', () => {
	if (state.image.fileUrl) {
		URL.revokeObjectURL(state.image.fileUrl);
	}
});

renderTemplateSelection();
renderBoxes();
renderForm();

if (refs.image.complete) {
	syncImageMetrics();
}
