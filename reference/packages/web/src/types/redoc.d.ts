declare module 'redoc' {
  import * as React from 'react';

  export interface RedocStandaloneProps {
    specUrl: string;
    options?: object;
  }

  export class RedocStandalone extends React.Component<RedocStandaloneProps> {}
} 