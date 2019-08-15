import {
  AttributesErrors,
  AttrTypes,
  FormFeaturesErrors,
  generateAttributeError,
  NameErrors,
  RegistriesErrors,
  required,
  Schema,
} from './schema';


describe('Schema validations', () => {

  describe('Name validation', () => {
    it('should fail when name is not set', () => {
      expect(() => {
        Schema.validateName(undefined);
      }).toThrow(NameErrors.NAME_FORMAT);
    });

    it('should pass the name validation ', () => {
      expect(() => {
        Schema.validateName('some random string %##$%#$');
      }).not.toThrow();
    });

  });

  describe('Attributes Validation', () => {
    it('should fail when attributes is not set or not an array', () => {
      expect(() => {
        Schema.validateAttributes(undefined);
      }).toThrow(AttributesErrors.ATTRIBUTES_FORMAT);

      expect(() => {
        Schema.validateAttributes([]);
      }).toThrow(AttributesErrors.ATTRIBUTES_FORMAT);
    });

    it('should fail when an attributes does have name prop set', () => {
      expect(() => {
        Schema.validateAttributes([{}]);
      }).toThrow(AttributesErrors.NAME_PROP_MISSING);
    });

    it('should fail when an attributes does have label prop set', () => {
      expect(() => {
        Schema.validateAttributes([{ name: 'test' }]);
      }).toThrow(AttributesErrors.LABEL_PROP_MISSING);
    });

    it('should fail when an attributes does have type prop set', () => {
      expect(() => {
        Schema.validateAttributes([{
          name: 'test',
          label: 'test',
        }]);
      }).toThrow(AttributesErrors.TYPE_PROP_MISSING);
    });

    it('should fail when type is not supported', () => {
      expect(() => {
        Schema.validateAttributes([{
          name: 'test',
          label: 'test',
          type: 'test',
        }]);
      }).toThrow(AttributesErrors.TYPE_NOT_SUPPORTED);
    });

    it('should fail when options is not an array', () => {
      expect(() => {
        Schema.validateAttributes([{
          name: 'test',
          label: 'test',
          type: AttrTypes.STRING,
          options: {},
        }]);
      }).toThrow(AttributesErrors.OPTIONS_BAD_FORMAT);
    });

    it('should fail if options are present on a timestamp field', () => {
      expect(() => {
        Schema.validateAttributes([{
          name: 'test',
          label: 'test',
          type: AttrTypes.TIMESTAMP,
          options: [],
        }]);
      }).toThrow(AttributesErrors.OPTIONS_EMPTY);
    });

    it('should fail if schema defines comments', () => {
      expect(() => {
        Schema.validateAttributes([{
          name: 'comments',
          label: 'test',
          type: AttrTypes.STRING,
        }]);
      }).toThrow(AttributesErrors.COMMENTS_RESERVED);
    });

    it('should fail for nested attributes', () => {
      expect(() => {
        Schema.validateAttributes([{
          name: 'test.property',
          label: 'test',
          type: AttrTypes.STRING,
        }]);
      }).toThrow(AttributesErrors.NESTED_ATTRIBUTES_NOT_SUPPORTED);

      expect(() => {
        Schema.validateAttributes([{
          name: 'test[0]',
          label: 'test',
          type: AttrTypes.STRING,
        }]);
      }).toThrow(AttributesErrors.NESTED_ATTRIBUTES_NOT_SUPPORTED);
    });

    it('should fail if schema does not contain a reference_id attribute', () => {
      expect(() => {
        Schema.validateAttributes([{
          name: 'test',
          label: 'test',
          type: AttrTypes.STRING,
        }]);
      }).toThrow(AttributesErrors.REFERENCE_ID_MISSING);
    });

    it('should pass the attribute validation', () => {
      expect(() => {
        Schema.validateAttributes([{
          name: 'reference_id',
          label: 'test',
          type: AttrTypes.STRING,
        }]);
      }).not.toThrow();
    });
  });

  describe('Registries Validation', () => {
    it('should fail when registries is not set or not an array', () => {
      expect(() => {
        Schema.validateRegistries(undefined);
      }).toThrow(RegistriesErrors.REGISTRIES_FORMAT);

      expect(() => {
        Schema.validateRegistries({});
      }).toThrow(RegistriesErrors.REGISTRIES_FORMAT);
    });

    it('should fail if a registry does not contain an address prop', () => {
      expect(() => {
        Schema.validateRegistries([{}]);
      }).toThrow(RegistriesErrors.ADDRESS_PROP_MISSING);

    });

    it('should fail if a registry has bad formatted eth address', () => {
      expect(() => {
        Schema.validateRegistries([{ address: 'random stuff that is not an eth address' }]);
      }).toThrow(RegistriesErrors.ADDRESS_FORMAT);

    });

    it('should fail if a registry does not contain a label prop', () => {
      expect(() => {
        Schema.validateRegistries([{ address: '0xFaC5A4BA4CF34D82C7CA0c8004A8421be1679B71' }]);
      }).toThrow(RegistriesErrors.LABEL_PROP_MISSING);

    });

    it('should fail if a registry does not contain a proofs array', () => {
      expect(() => {
        Schema.validateRegistries([{
          address: '0xFaC5A4BA4CF34D82C7CA0c8004A8421be1679B71',
          label: 'Some Label',
        }]);
      }).toThrow(RegistriesErrors.PROOF_ARRAY_MISSING);

      expect(() => {
        Schema.validateRegistries([{
          address: '0xFaC5A4BA4CF34D82C7CA0c8004A8421be1679B71',
          label: 'Some Label',
          proofs: {},
        }]);
      }).toThrow(RegistriesErrors.PROOF_ARRAY_MISSING);

      expect(() => {
        Schema.validateRegistries([{
          address: '0xFaC5A4BA4CF34D82C7CA0c8004A8421be1679B71',
          label: 'Some Label',
          proofs: [],
        }]);
      }).toThrow(RegistriesErrors.PROOF_ARRAY_MISSING);
    });

    it('should pass the registry validation', () => {
      expect(() => {
        Schema.validateRegistries([{
          address: '0xFaC5A4BA4CF34D82C7CA0c8004A8421be1679B71',
          label: 'Some Label',
          proofs: ['someproof'],
        }]);
      }).not.toThrow();
    });
  });

  describe('Form Features Validation', () => {
    it('should not fail if formFeatures is not set', () => {
      expect(() => {
        Schema.validateFormFeatures(undefined);
      }).not.toThrow();

      expect(() => {
        Schema.validateFormFeatures({});
      }).not.toThrow();
    });

    it('should  have columnNo and comments as an optional field', () => {
      expect(() => {
        Schema.validateFormFeatures({ otherProp: 0 });
      }).not.toThrow();
    });

    it('should  fail if columnNo is not integer bigger than 0', () => {
      expect(() => {
        Schema.validateFormFeatures({ columnNo: null });
      }).toThrow(FormFeaturesErrors.COLUMN_NO_FORMAT);

      expect(() => {
        Schema.validateFormFeatures({ columnNo: 'sddd' });
      }).toThrow(FormFeaturesErrors.COLUMN_NO_FORMAT);

      expect(() => {
        Schema.validateFormFeatures({ columnNo: new Date() });
      }).toThrow(FormFeaturesErrors.COLUMN_NO_FORMAT);

      expect(() => {
        Schema.validateFormFeatures({ columnNo: 0 });
      }).toThrow(FormFeaturesErrors.COLUMN_NO_FORMAT);

      expect(() => {
        Schema.validateFormFeatures({ otherProp: 0 });
      }).not.toThrow();

    });

    it('should  fail if comments in not a boolean', () => {
      expect(() => {
        Schema.validateFormFeatures({ comments: null });
      }).toThrow(FormFeaturesErrors.COMMENTS_FORMAT);

      expect(() => {
        Schema.validateFormFeatures({ comments: undefined });
      }).toThrow(FormFeaturesErrors.COMMENTS_FORMAT);

      expect(() => {
        Schema.validateFormFeatures({ comments: {} });
      }).toThrow(FormFeaturesErrors.COMMENTS_FORMAT);

      expect(() => {
        Schema.validateFormFeatures({ comments: 'yes' });
      }).toThrow(FormFeaturesErrors.COMMENTS_FORMAT);

    });

    it('should  pass Form Features validation', () => {
      expect(() => {
        Schema.validateFormFeatures({
          columnNo: 4,
          comments: true,
        })
      }).not.toThrow();

      expect(() => {
        Schema.validateFormFeatures({
          columnNo: 4,
          comments: false,
        })
      }).not.toThrow();

    });

  });

});


