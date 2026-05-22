import '@testing-library/jest-dom';

// Stub model-viewer web component for jsdom
if (typeof customElements !== 'undefined') {
  if (!customElements.get('model-viewer')) {
    class ModelViewerElement extends HTMLElement {}
    customElements.define('model-viewer', ModelViewerElement);
  }
}
