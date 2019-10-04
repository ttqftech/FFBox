import ButtonBox from '../electron/components/parabox/Buttonbox';

export default {
  title: 'FFBox/Button',
  component: ButtonBox,
  // argTypes: {
    // backgroundColor: { control: 'color' },
    // size: { control: { type: 'select', options: ['small', 'medium', 'large'] } },
  // },
};

export const def = () => ({
  components: { ButtonBox },
  template: ''
})
const Template = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { MyButton },
  template: '<buttonbox text="恢复默认参数" v-bind="$props"></buttonbox>',
});
