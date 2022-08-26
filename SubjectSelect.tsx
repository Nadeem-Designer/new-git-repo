import React from 'react';
import SchoolClassesField from "./SchoolClassesField";
import SubjectSelect from "./SubjectSelect";
export default {
  title: "SubjectSelect",
  component: SubjectSelect,
};
const Template = (args: any) => (
    <SubjectSelect taskId={"0"} onSubjectChanged={() => {}} value={"Computer"}/>
);
export const Primary = Template.bind({}) as any;
Primary.args = {};
