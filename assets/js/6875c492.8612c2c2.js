"use strict";(self.webpackChunkdocs=self.webpackChunkdocs||[]).push([[4813],{322:(e,t,n)=>{n.d(t,{A:()=>_});n(8101);var s=n(3526),a=n(1196),i=n(5105);function r(e){let{children:t,className:n}=e;return(0,i.jsx)("article",{className:n,children:t})}var l=n(5162);const o={title:"title_okqI"};function c(e){let{className:t}=e;const{metadata:n,isBlogPostPage:r}=(0,a.e7)(),{permalink:c,title:d}=n,u=r?"h1":"h2";return(0,i.jsx)(u,{className:(0,s.A)(o.title,t),children:r?d:(0,i.jsx)(l.A,{to:c,children:d})})}var d=n(7229),u=n(1520),g=n(1543);const m={container:"container_JGTc"};function h(e){let{readingTime:t}=e;const n=function(){const{selectMessage:e}=(0,u.W)();return t=>{const n=Math.ceil(t);return e(n,(0,d.T)({id:"theme.blog.post.readingTime.plurals",description:'Pluralized label for "{readingTime} min read". Use as much plural forms (separated by "|") as your language support (see https://www.unicode.org/cldr/cldr-aux/charts/34/supplemental/language_plural_rules.html)',message:"One min read|{readingTime} min read"},{readingTime:n}))}}();return(0,i.jsx)(i.Fragment,{children:n(t)})}function p(e){let{date:t,formattedDate:n}=e;return(0,i.jsx)("time",{dateTime:t,children:n})}function x(){return(0,i.jsx)(i.Fragment,{children:" \xb7 "})}function j(e){let{className:t}=e;const{metadata:n}=(0,a.e7)(),{date:r,readingTime:l}=n,o=(0,g.i)({day:"numeric",month:"long",year:"numeric",timeZone:"UTC"});return(0,i.jsxs)("div",{className:(0,s.A)(m.container,"margin-vert--md",t),children:[(0,i.jsx)(p,{date:r,formattedDate:(c=r,o.format(new Date(c)))}),void 0!==l&&(0,i.jsxs)(i.Fragment,{children:[(0,i.jsx)(x,{}),(0,i.jsx)(h,{readingTime:l})]})]});var c}var b=n(2631);const f={authorCol:"authorCol_n92T",imageOnlyAuthorRow:"imageOnlyAuthorRow_rbvl",imageOnlyAuthorCol:"imageOnlyAuthorCol_z3qi"};function A(e){let{className:t}=e;const{metadata:{authors:n},assets:r}=(0,a.e7)();if(0===n.length)return null;const l=n.every((e=>{let{name:t}=e;return!t})),o=1===n.length;return(0,i.jsx)("div",{className:(0,s.A)("margin-top--md margin-bottom--sm",l?f.imageOnlyAuthorRow:"row",t),children:n.map(((e,t)=>(0,i.jsx)("div",{className:(0,s.A)(!l&&(o?"col col--12":"col col--6"),l?f.imageOnlyAuthorCol:f.authorCol),children:(0,i.jsx)(b.A,{author:{...e,imageURL:r.authorsImageUrls[t]??e.imageURL}})},t)))})}function T(){return(0,i.jsxs)("header",{children:[(0,i.jsx)(c,{}),(0,i.jsx)(j,{}),(0,i.jsx)(A,{})]})}var v=n(4776),N=n(4186);function w(e){let{children:t,className:n}=e;const{isBlogPostPage:r}=(0,a.e7)();return(0,i.jsx)("div",{id:r?v.LU:void 0,className:(0,s.A)("markdown",n),children:(0,i.jsx)(N.A,{children:t})})}var y=n(4166),P=n(7349),k=n(2293);function U(){return(0,i.jsx)("b",{children:(0,i.jsx)(d.A,{id:"theme.blog.post.readMore",description:"The label used in blog post item excerpts to link to full blog posts",children:"Read more"})})}function R(e){const{blogPostTitle:t,...n}=e;return(0,i.jsx)(l.A,{"aria-label":(0,d.T)({message:"Read more about {title}",id:"theme.blog.post.readMoreLabel",description:"The ARIA label for the link to full blog posts from excerpts"},{title:t}),...n,children:(0,i.jsx)(U,{})})}function B(){const{metadata:e,isBlogPostPage:t}=(0,a.e7)(),{tags:n,title:r,editUrl:l,hasTruncateMarker:o,lastUpdatedBy:c,lastUpdatedAt:d}=e,u=!t&&o,g=n.length>0;if(!(g||u||l))return null;if(t){const e=!!(l||d||c);return(0,i.jsxs)("footer",{className:"docusaurus-mt-lg",children:[g&&(0,i.jsx)("div",{className:(0,s.A)("row","margin-top--sm",y.G.blog.blogFooterEditMetaRow),children:(0,i.jsx)("div",{className:"col",children:(0,i.jsx)(k.A,{tags:n})})}),e&&(0,i.jsx)(P.A,{className:(0,s.A)("margin-top--sm",y.G.blog.blogFooterEditMetaRow),editUrl:l,lastUpdatedAt:d,lastUpdatedBy:c})]})}return(0,i.jsxs)("footer",{className:"row docusaurus-mt-lg",children:[g&&(0,i.jsx)("div",{className:(0,s.A)("col",{"col--9":u}),children:(0,i.jsx)(k.A,{tags:n})}),u&&(0,i.jsx)("div",{className:(0,s.A)("col text--right",{"col--3":g}),children:(0,i.jsx)(R,{blogPostTitle:r,to:e.permalink})})]})}function _(e){let{children:t,className:n}=e;const l=function(){const{isBlogPostPage:e}=(0,a.e7)();return e?void 0:"margin-bottom--xl"}();return(0,i.jsxs)(r,{className:(0,s.A)(l,n),children:[(0,i.jsx)(T,{}),(0,i.jsx)(w,{children:t}),(0,i.jsx)(B,{})]})}},401:(e,t,n)=>{n.d(t,{A:()=>r});n(8101);var s=n(1196),a=n(322),i=n(5105);function r(e){let{items:t,component:n=a.A}=e;return(0,i.jsx)(i.Fragment,{children:t.map((e=>{let{content:t}=e;return(0,i.jsx)(s.in,{content:t,children:(0,i.jsx)(n,{children:(0,i.jsx)(t,{})})},t.metadata.permalink)}))})}},992:(e,t,n)=>{n.r(t),n.d(t,{default:()=>b});n(8101);var s=n(3526),a=n(7229),i=n(8154),r=n(4166),l=n(5964),o=n(5162),c=n(4113),d=n(9036),u=n(3992),g=n(401),m=n(3933),h=n(9653),p=n(5105);function x(e){let{tag:t}=e;const n=(0,l.ZD)(t);return(0,p.jsxs)(p.Fragment,{children:[(0,p.jsx)(i.be,{title:n,description:t.description}),(0,p.jsx)(u.A,{tag:"blog_tags_posts"})]})}function j(e){let{tag:t,items:n,sidebar:s,listMetadata:i}=e;const r=(0,l.ZD)(t);return(0,p.jsxs)(c.A,{sidebar:s,children:[t.unlisted&&(0,p.jsx)(m.A,{}),(0,p.jsxs)("header",{className:"margin-bottom--xl",children:[(0,p.jsx)(h.A,{as:"h1",children:r}),t.description&&(0,p.jsx)("p",{children:t.description}),(0,p.jsx)(o.A,{href:t.allTagsPath,children:(0,p.jsx)(a.A,{id:"theme.tags.tagsPageLink",description:"The label of the link targeting the tag list page",children:"View All Tags"})})]}),(0,p.jsx)(g.A,{items:n}),(0,p.jsx)(d.A,{metadata:i})]})}function b(e){return(0,p.jsxs)(i.e3,{className:(0,s.A)(r.G.wrapper.blogPages,r.G.page.blogTagPostListPage),children:[(0,p.jsx)(x,{...e}),(0,p.jsx)(j,{...e})]})}},1067:(e,t,n)=>{n.d(t,{AE:()=>o,Rc:()=>r,TT:()=>d,Uh:()=>l,Yh:()=>c});n(8101);var s=n(7229),a=n(7088),i=n(5105);function r(){return(0,i.jsx)(s.A,{id:"theme.contentVisibility.unlistedBanner.title",description:"The unlisted content banner title",children:"Unlisted page"})}function l(){return(0,i.jsx)(s.A,{id:"theme.contentVisibility.unlistedBanner.message",description:"The unlisted content banner message",children:"This page is unlisted. Search engines will not index it, and only users having a direct link can access it."})}function o(){return(0,i.jsx)(a.A,{children:(0,i.jsx)("meta",{name:"robots",content:"noindex, nofollow"})})}function c(){return(0,i.jsx)(s.A,{id:"theme.contentVisibility.draftBanner.title",description:"The draft content banner title",children:"Draft page"})}function d(){return(0,i.jsx)(s.A,{id:"theme.contentVisibility.draftBanner.message",description:"The draft content banner message",children:"This page is a draft. It will only be visible in dev and be excluded from the production build."})}},3933:(e,t,n)=>{n.d(t,{A:()=>c});n(8101);var s=n(3526),a=n(1067),i=n(4166),r=n(6120),l=n(5105);function o(e){let{className:t}=e;return(0,l.jsx)(r.A,{type:"caution",title:(0,l.jsx)(a.Rc,{}),className:(0,s.A)(t,i.G.common.unlistedBanner),children:(0,l.jsx)(a.Uh,{})})}function c(e){return(0,l.jsxs)(l.Fragment,{children:[(0,l.jsx)(a.AE,{}),(0,l.jsx)(o,{...e})]})}},5964:(e,t,n)=>{n.d(t,{ZD:()=>r,uz:()=>l});n(8101);var s=n(7229),a=n(1520);n(5105);function i(){const{selectMessage:e}=(0,a.W)();return t=>e(t,(0,s.T)({id:"theme.blog.post.plurals",description:'Pluralized label for "{count} posts". Use as much plural forms (separated by "|") as your language support (see https://www.unicode.org/cldr/cldr-aux/charts/34/supplemental/language_plural_rules.html)',message:"One post|{count} posts"},{count:t}))}function r(e){const t=i();return(0,s.T)({id:"theme.blog.tagTitle",description:"The title of the page for a blog tag",message:'{nPosts} tagged with "{tagName}"'},{nPosts:t(e.count),tagName:e.label})}const l=()=>(0,s.T)({id:"theme.blog.authorsList.pageTitle",message:"Authors",description:"The title of the authors page"})},9036:(e,t,n)=>{n.d(t,{A:()=>r});n(8101);var s=n(7229),a=n(3357),i=n(5105);function r(e){const{metadata:t}=e,{previousPage:n,nextPage:r}=t;return(0,i.jsxs)("nav",{className:"pagination-nav","aria-label":(0,s.T)({id:"theme.blog.paginator.navAriaLabel",message:"Blog list page navigation",description:"The ARIA label for the blog pagination"}),children:[n&&(0,i.jsx)(a.A,{permalink:n,title:(0,i.jsx)(s.A,{id:"theme.blog.paginator.newerEntries",description:"The label used to navigate to the newer blog posts page (previous page)",children:"Newer entries"})}),r&&(0,i.jsx)(a.A,{permalink:r,title:(0,i.jsx)(s.A,{id:"theme.blog.paginator.olderEntries",description:"The label used to navigate to the older blog posts page (next page)",children:"Older entries"}),isNext:!0})]})}}}]);