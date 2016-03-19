---
title: Experience OnStar
roles:
  - web developer
date: 2015-06-27
sexiness: 4
masthead: interactive/experience-onstar.png
siteUrl: http://experienceonstar.com
---

<p class="h3">Winner of a Gold 2015 [Pearl Award](http://thecontentcouncil.org/Pearl-Awards) for Best Blog/Series of Blog Posts.</p>

<p class="lead-in">
This OnStar blog uses modular design and development to allow content editors to create uniquely art directed articles while maintaining a unified design feel.
</p>

<aside class="pull-quote halftone right">
  <p>The project had to keep several different user groups in mind, still giving an optimal experience to each.</p>
</aside>

This site is a redesign of what used to be called OnStar Connections.  Its purpose is to tell stories of OnStar subscribers, offer tips and additional uses of the service, and educate potential new customers of its value.  I was the sole developer for most of the build cycle.

## As a Code Monkey...

I used [Craft CMS](http://buildwithcraft.com/) to build a one of a kind interface. Craft gave me the ability to implement a standard system, extrapolating a set of rules from the static design, so that the content managers have the ability to control the appearance and flow of their articles within the set limits. There are also a number of engagement techniques to draw readers in, drastically increasing page views per visit over the previous site.

### Many Kinds of Users

The project had to keep several different user groups in mind, still giving an optimal experience to each.

The first user group is people who want to read stories of OnStar in use or get tips on ways to use its features to their advantage. This may be because they are still deciding if they want to subscribe, or because they've already subscribed and want to get more from that subscription. To serve this group, there is the front end you see when visiting the site. This design has a number of features to draw browsers in, including an immediately obvious hierarchy to the stories' values and lots of cross linking between these stories.  The stories themselves of course have varying appearances, in order to better serve the content. Once the user finds a story that interests them, they can also just continue reading uninterrupted as the next article in the same category is automatically loaded asynchronously underneath.

<figure class="figure full">
![Sample of the Craft CMS being used to design an article](/images/work/experience-onstar-cms-sample.jpg)
</figure>

In order to bring all these features in, I also had to accommodate the other main user group: content editors. Using the custom fields I created in the Craft control panel, they have the ability to visually design their content (within the web designer's pre-set restrictions), mark its level of hierarchy for the archive pages, and add information flyouts and banner ads to the sidebar.

Further, the site also has what we call "Cover Stories."  These are special articles that a developer hand codes, allowing them to offer unique interactive experiences. These have all the same taxonomy and hierarchy controls of normal stories, but are otherwise flat HTML pages that are automatically wrapped with the site's global header and footer by the system I built. You can check out a [listing of them](http://www.experienceonstar.com/cover-stories), or read about [one of my favorites](/work/a-race-against-time) that I created.
