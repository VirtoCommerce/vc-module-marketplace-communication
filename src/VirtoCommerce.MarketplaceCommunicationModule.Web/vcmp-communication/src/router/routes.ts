import { RouteRecordRaw } from "vue-router";
import App from "../pages/App.vue";
import { Invite, Login, ResetPassword, useBladeNavigation, ChangePasswordPage, BladeVNode } from "@vc-shell/framework";
// eslint-disable-next-line import/no-unresolved
import whiteLogoImage from "/assets/logo-white.svg";
// eslint-disable-next-line import/no-unresolved
import bgImage from "/assets/background.jpg";

const sellerIdRegex = "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}";

export const routes: RouteRecordRaw[] = [
  {
    path: `/:sellerId(${sellerIdRegex})?`,
    component: App,
    name: "App",
    meta: {
      root: true,
    },
    children: [],
    redirect: "/communication",
    beforeEnter: (to) => {
      const { sellerId } = to.params;

      if (!sellerId || new RegExp(sellerIdRegex).test(sellerId as string)) {
        return true;
      } else {
        return { path: (to.matched[1].components?.default as BladeVNode).type.url as string };
      }
    },
  },
  {
    name: "Login",
    path: "/login",
    component: Login,
    props: () => ({
      logo: whiteLogoImage,
      background: bgImage,
      title: "Communication App",
    }),
  },
  {
    name: "Invite",
    path: "/invite",
    component: Invite,
    props: (route) => ({
      userId: route.query.userId,
      token: route.query.token,
      userName: route.query.userName,
      logo: whiteLogoImage,
      background: bgImage,
    }),
  },
  {
    name: "ResetPassword",
    path: "/resetpassword",
    component: ResetPassword,
    props: (route) => ({
      userId: route.query.userId,
      token: route.query.token,
      userName: route.query.userName,
      logo: whiteLogoImage,
      background: bgImage,
    }),
  },
  {
    name: "ChangePassword",
    path: "/changepassword",
    component: ChangePasswordPage,
    meta: {
      forced: true,
    },
    props: (route) => ({
      background: bgImage,
    }),
  },
  {
    path: `/:sellerId(${sellerIdRegex})?/:pathMatch(.*)*`,
    component: App,
    beforeEnter: async (to) => {
      const { routeResolver } = useBladeNavigation();
      return routeResolver(to);
    },
  },
];
