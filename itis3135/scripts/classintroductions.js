// Loads every class introduction from the API and shows them on the page.
async function loadIntroductions() {
    const container = document.getElementById("introductions");

    try {
        const response = await fetch("https://intro-form.tommyhost.ing/");
        const all = await response.json();

        container.textContent = ""; // clear the "Loading..." message

        for (const username in all) {
            const record = all[username];
            const data = record.introductionData;
            if (!data) {
                continue; // skip anyone without introduction data
            }

            const section = document.createElement("section");

            // Name and animal, e.g. "Samuel Consuegra | Sneaky Crocodile"
            const heading = document.createElement("h3");
            const divider = data.prettyNameDivider || "|";
            heading.textContent = data.firstName + " " + data.lastName + " " + divider + " " +
                (data.adjectives || "") + " " + (data.animal || "");
            section.append(heading);

            // Image (data:image text, a full URL, or a path relative to their site)
            if (data.img) {
                const picture = document.createElement("img");
                if (data.img.startsWith("data:") || data.img.startsWith("http")) {
                    picture.src = data.img;
                } else {
                    picture.src = record.baseSiteUrl + "itis3135/" + data.img;
                }
                picture.alt = data.pictureAlt || username;
                picture.style.maxWidth = "200px";
                section.append(picture);
            }

            // First three courses
            if (Array.isArray(data.courses)) {
                const list = document.createElement("ul");
                for (const course of data.courses.slice(0, 3)) {
                    const item = document.createElement("li");
                    item.textContent = course.department + " " + course.courseNumber + " - " + course.courseTitle;
                    list.append(item);
                }
                section.append(list);
            }

            // Quote and who said it
            if (data.quote) {
                const quote = document.createElement("blockquote");
                quote.textContent = "\"" + data.quote + "\"";
                const author = document.createElement("p");
                author.textContent = "- " + (data.quoteAuthor || "Unknown");
                section.append(quote);
                section.append(author);
            }

            container.append(section);
            container.append(document.createElement("hr"));
        }
    } catch (error) {
        container.textContent = "Could not load introductions.";
        console.error(error);
    }
}

loadIntroductions();
