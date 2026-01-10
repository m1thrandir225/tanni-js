import { DOM_TYPES } from './h';

export function mountDOM(vdom, parentEl) {
  switch (vdom.type) {
    case DOM_TYPES.TEXT: {
      createTextNode(vdom, parentEl);
      break;
    }
    case DOM_TYPES.ELEMENT: {
      createElementNode(vdom, parentEl);
      break;
    }
    case DOM_TYPES.FRAGMENT: {
      createFragmentNodes(vdom, parentEl);
      break;
    }
    default: {
      throw new Error(`Can't mound a DOM of type: ${vdom.type}`);
    }
  }
}

function createTextNode(vdom, parentEl) {
  const { value } = vdom;

  const textNode = document.createTextNode(value);
  vdom.el = textNode;

  parentEl.append(textNode);
}

function createFragmentNodes(vdom, parentEl) {
  const { children } = vdom;

  vdom.el = parentEl;

  children.forEach((child) => mountDOM(child, parentEl));
}

function createElementNode(vdom, parentEl) {
  console.log(vdom, parentEl);
}
