
// import { Chart } from 'react-chartjs-2';
import { Routes, Route } from 'react-router-dom';
import AuthForm from './components/Authentication/Login';
import Register from './components/Authentication/Register';
import MainNavigation from './components/NavigationBar';
import RequireAuth from './components/Authentication/RequireAuth';
import React from 'react';
import Page from './components/Main';
import FarmEdit from './components/Farm/FarmEdit';
import FieldEdit from './components/Field/FieldEdit';
import FarmNew  from './components/Farm/FarmNew';
import OpenField from './components/Field/OpenField';
import AllFields from './components/Field/AllFields';
import DrawField from './components/Field/DrawField';
import UploadField from './components/Field/UploadField';
import AllFarms from './components/Farm/AllFarms';
import AboutUsDoc from './components/AboutUs';
import ResearchGroupDoc from './components/ResearchGroupDoc';
import Documentation_yieldQuality from './components/Documentation_yq';
import Documentation_EconomicModel from './components/documentation_EcoModel';
import ManageUsers from './components/ManageUsers';
import Disclaimer from './components/Disclaimer';



function App() {
  return (
    <div>
      <Disclaimer />
      <div>
        <MainNavigation />
      </div>
      <Routes>
        <Route path="/" element={<Page />} />
        <Route path="/manage-users" element={<ManageUsers />} />
        <Route path='/auth/login' element={<AuthForm />} />
        <Route path="/documentation_aboutus"       element={<AboutUsDoc />} />
        <Route path="/documentation_researchgroup" element={<ResearchGroupDoc />} />
        <Route path="/documentation_yieldQuality" element={<Documentation_yieldQuality />}/>
        <Route path="/documentation_EconomicModel" element={<Documentation_EconomicModel />}/>
        <Route path='/auth/register' element={<Register />} />
        <Route element={<RequireAuth />}>
          <Route path="/farm" element={<AllFarms />} />
          <Route path="/newFarm/" element={<FarmNew />} />
          <Route path="/farm/:id/edit" element={<FarmEdit />} />
          
          <Route path="/:id/fields" element={<AllFields />} />
          <Route path="/:id/field/:id" element={<OpenField />} />
          
          <Route path="/:id/newField/Draw" element={<DrawField />} />
          <Route path="/:id/newField/Upload" element={<UploadField />} />
          
          <Route path="/:id/field/:id/edit" element={<FieldEdit />} />
        </Route>
      </Routes>
    </div>
  );
}

export default App;
