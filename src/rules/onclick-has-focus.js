/**
 * @fileoverview Enforce that elements with onClick handlers must be focusable.
 * @author Ethan Cohen
 * @flow
 */

import { dom } from 'aria-query';
import {
  getLiteralPropValue,
  getProp,
  elementType,
} from 'jsx-ast-utils';
import type { JSXOpeningElement } from 'ast-types-flow';
import { generateObjSchema } from '../util/schemas';
import isHiddenFromScreenReader from '../util/isHiddenFromScreenReader';
import isInteractiveElement from '../util/isInteractiveElement';
import isInteractiveRole from '../util/isInteractiveRole';
import getTabIndex from '../util/getTabIndex';

// ----------------------------------------------------------------------------
// Rule Definition
// ----------------------------------------------------------------------------

const errorMessage =
  'An non-interactive element with an onClick handler and an ' +
  'interactive role must be focusable. Either set the tabIndex property to ' +
  'a valid value (usually 0) or use an element type which is inherently ' +
  'focusable such as `button`.';

const schema = generateObjSchema();
const domElements = [...dom.keys()];

module.exports = {
  meta: {
    docs: {},
    schema: [schema],
  },

  create: (context: ESLintContext) => ({
    JSXOpeningElement: (
      node: JSXOpeningElement,
    ) => {
      const { attributes } = node;
      if (getProp(attributes, 'onClick') === undefined) {
        return;
      }

      const type = elementType(node);

      if (!domElements.includes(type)) {
        // Do not test higher level JSX components, as we do not know what
        // low-level DOM element this maps to.
        return;
      } else if (isHiddenFromScreenReader(type, attributes)) {
        return;
      } else if (isInteractiveElement(type, attributes)) {
        return;
      } else if (
        ['presentation', 'none'].indexOf(
          getLiteralPropValue(getProp(attributes, 'role')),
        ) > -1
      ) {
        // Presentation is an intentional signal from the author that this
        // element is not meant to be perceivable. For example, a click screen
        // to close a dialog .
        return;
      } else if (
        isInteractiveRole(type, attributes)
        && getTabIndex(getProp(attributes, 'tabIndex')) !== undefined
      ) {
        return;
      }

      context.report({
        node,
        message: errorMessage,
      });
    },
  }),
};
