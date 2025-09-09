import { render } from '@testing-library/react';
import React from 'react';

import Home from '../src/app/page';

describe('Home', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<Home />);
    expect(baseElement).toBeTruthy();
  });
});
