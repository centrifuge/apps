import toJson from 'enzyme-to-json';

export const serializeSnapshot = (component) => {
  // We are not interested in the theme prop and we remove it in order to reduce file size
  return toJson(
    component,
    {
      noKey: false,
      mode: 'deep',
      map: (node => {
        delete node.props.theme;
        if(node.props.dropContent) {
          node.props.dropContent = null
        }

        return node;
      }),
    },
  );
};
