import React from 'react';
import ReactDOM from 'react-dom';

// import NewsComponent from './components/NewsComponent.jsx';
// import './component-styles.scss';

const renderComponents = () => {
    const components = document.querySelectorAll('[data-react-component]');

    components.forEach((element) => {
        const componentName = element.dataset.reactComponent;
        const Component = require(`./components/${componentName}`).default;

        ReactDOM.render(<Component />, element);
    });
};

renderComponents();