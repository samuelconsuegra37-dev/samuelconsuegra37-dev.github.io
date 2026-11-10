const formElement = document.getElementById("form");
const formHeading = document.getElementById("form-heading");
const coursesContainer = document.getElementById("courses");
const addCourseButton = document.getElementById("add-course");
const clearButton = document.getElementById("clear-button");
const generateHtmlButton = document.getElementById("generate-html");
const generateJsonButton = document.getElementById("generate-json");
const generateXmlButton = document.getElementById("generate-xml");
const resultContainer = document.getElementById("intro-result");

const defaultPicture = "images/profile2.jpg";

// Prevents page refresh / default submit behavior; the script handles submitting instead
formElement.addEventListener("submit", (e) => e.preventDefault());

// Checks whether a date string is a real calendar date in YYYY-MM-DD format
function isRealDate(text) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
        return false;
    }
    const [year, month, day] = text.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

// Date input polyfill: browsers without a date picker get a text box that only accepts real YYYY-MM-DD dates
function polyfillDateInput(dateInput) {
    const test = document.createElement("input");
    test.setAttribute("type", "date");
    test.value = "not-a-date";
    // Browsers that support date inputs keep the type and reject invalid text
    const supported = test.type === "date" && test.value !== "not-a-date";
    if (supported) {
        return;
    }

    dateInput.type = "text";
    dateInput.placeholder = "YYYY-MM-DD";
    dateInput.addEventListener("input", () => {
        const value = dateInput.value.trim();
        const message = value && !isRealDate(value) ? "Enter a real date as YYYY-MM-DD, like 2026-11-09." : "";
        dateInput.setCustomValidity(message);
    });
}

polyfillDateInput(formElement.elements["acknowledgment-date"]);

// Makes a new element with optional text (textContent keeps user input from being read as HTML)
function makeElement(tag, text) {
    const element = document.createElement(tag);
    if (text) {
        element.textContent = text;
    }
    return element;
}

// Gets the trimmed value of a field by its name
function getValue(name) {
    return formElement.elements[name].value.trim();
}

// Stops the form from submitting without the required information
function validateForm() {
    // reportValidity shows the browser's message on the first missing or invalid field
    return formElement.reportValidity();
}

// Keeps course legends numbered in order after adding or deleting
function renumberCourses() {
    const courses = coursesContainer.querySelectorAll(".course");
    courses.forEach((course, index) => {
        course.querySelector("legend").textContent = `Course ${index + 1}`;
    });
}

// Adds a delete button beside a new course
function addDeleteButton(course) {
    const deleteButton = makeElement("button", "Delete Course");
    deleteButton.type = "button";
    deleteButton.addEventListener("click", () => {
        course.remove();
        renumberCourses();
    });
    const wrapper = makeElement("p");
    wrapper.appendChild(deleteButton);
    course.appendChild(wrapper);
}

// Adds a new set of course text boxes
function addCourse() {
    const course = makeElement("fieldset");
    course.className = "course";
    course.appendChild(makeElement("legend"));

    ["Department", "Number", "Name", "Reason"].forEach((field) => {
        const label = makeElement("label", `${field} `);
        const input = makeElement("input");
        input.type = "text";
        input.name = `course-${field.toLowerCase()}`;
        input.required = true;
        label.appendChild(input);
        const wrapper = makeElement("p");
        wrapper.appendChild(label);
        course.appendChild(wrapper);
    });

    addDeleteButton(course);
    coursesContainer.appendChild(course);
    renumberCourses();
}

// Removes every added course, leaving only the first one
function removeAddedCourses() {
    const courses = coursesContainer.querySelectorAll(".course");
    courses.forEach((course, index) => {
        if (index > 0) {
            course.remove();
        }
    });
}

// Empties every field, including the defaults
function clearForm() {
    formElement.querySelectorAll("input, textarea").forEach((field) => {
        field.value = "";
    });
}

// Resets the progress of the form: puts back the defaults and shows the form again
function resetProgress() {
    formElement.reset();
    resultContainer.replaceChildren();
    resultContainer.hidden = true;
    formElement.hidden = false;
    formHeading.hidden = false;
    window.scrollTo(0, 0);
}

// Gathers all the form data into one object.
// For the page, an uploaded picture is shown from the browser's copy of the file;
// for generated code, it is written as images/<file name> since the file isn't on the server.
function gatherData(forDisplay) {
    const file = formElement.elements["picture"].files[0];
    let pictureSource = defaultPicture;
    if (file) {
        pictureSource = forDisplay ? URL.createObjectURL(file) : `images/${file.name}`;
    }

    const courses = [];
    coursesContainer.querySelectorAll(".course").forEach((course) => {
        const value = (name) => course.querySelector(`[name="course-${name}"]`).value.trim();
        courses.push({
            department: value("department"),
            number: value("number"),
            name: value("name"),
            reason: value("reason")
        });
    });

    return {
        firstName: getValue("first-name"),
        middleName: getValue("middle-name"),
        nickname: getValue("nickname"),
        lastName: getValue("last-name"),
        acknowledgmentStatement: getValue("acknowledgment"),
        acknowledgmentDate: getValue("acknowledgment-date"),
        mascotAdjective: getValue("mascot-adjective"),
        mascotAnimal: getValue("mascot-animal"),
        divider: getValue("divider"),
        picture: {
            source: pictureSource,
            caption: getValue("picture-caption")
        },
        personalStatement: getValue("personal-statement"),
        personalBackground: getValue("personal-background"),
        professionalBackground: getValue("professional-background"),
        academicBackground: getValue("academic-background"),
        subjectBackground: getValue("subject-background"),
        primaryComputer: getValue("primary-computer"),
        primaryLocation: getValue("primary-location"),
        alternateComputer: getValue("alternate-computer"),
        courses: courses,
        quote: getValue("quote"),
        quoteAuthor: getValue("quote-author"),
        funnyThing: getValue("funny-thing"),
        somethingToShare: getValue("something-to-share"),
        links: [
            { name: "CLT Web", url: getValue("link-clt-web") },
            { name: "GitHub.io", url: getValue("link-github-io") },
            { name: "GitHub", url: getValue("link-github") },
            { name: "freeCodeCamp", url: getValue("link-freecodecamp") },
            { name: "Codecademy", url: getValue("link-codecademy") },
            { name: "LinkedIn", url: getValue("link-linkedin") }
        ]
    };
}

// Makes a bullet with a bold label, like "Personal Background: ..."
function makeBullet(label, text) {
    const item = makeElement("li");
    item.appendChild(makeElement("strong", `${label}: `));
    item.appendChild(document.createTextNode(text));
    return item;
}

// Builds the finished introduction from the form data, laid out like the introduction page
function buildIntroduction(data) {
    // div: groups everything in the introduction so it can be shown or turned into code as one piece
    const introduction = makeElement("div");
    const fullName = [data.firstName, data.middleName, data.nickname ? `"${data.nickname}"` : "", data.lastName]
        .filter((part) => part)
        .join(" ");

    introduction.appendChild(makeElement("h3", `${fullName} ${data.divider} ${data.mascotAdjective} ${data.mascotAnimal}`));

    const figure = makeElement("figure");
    const image = makeElement("img");
    image.src = data.picture.source;
    image.alt = data.picture.caption;
    image.width = 200;
    figure.appendChild(image);
    figure.appendChild(makeElement("figcaption", data.picture.caption));
    introduction.appendChild(figure);

    introduction.appendChild(makeElement("p", data.personalStatement));

    const bullets = makeElement("ul");
    bullets.appendChild(makeBullet("Personal Background", data.personalBackground));
    bullets.appendChild(makeBullet("Professional Background", data.professionalBackground));
    bullets.appendChild(makeBullet("Academic Background", data.academicBackground));
    bullets.appendChild(makeBullet("Background in This Subject", data.subjectBackground));
    bullets.appendChild(makeBullet("Primary Work Computer", data.primaryComputer));
    bullets.appendChild(makeBullet("Primary Work Location", data.primaryLocation));
    bullets.appendChild(makeBullet("Alternate Computer and Location", data.alternateComputer));

    const coursesItem = makeElement("li");
    coursesItem.appendChild(makeElement("strong", "Courses I'm Taking and Why:"));
    const courseList = makeElement("ol");
    data.courses.forEach((course) => {
        courseList.appendChild(makeElement("li", `${course.department} ${course.number} - ${course.name}: ${course.reason}`));
    });
    coursesItem.appendChild(courseList);
    bullets.appendChild(coursesItem);

    // Optional fields only show up if they were filled in
    if (data.funnyThing) {
        bullets.appendChild(makeBullet("Funny Thing", data.funnyThing));
    }
    if (data.somethingToShare) {
        bullets.appendChild(makeBullet("Something I Would Like to Share", data.somethingToShare));
    }
    introduction.appendChild(bullets);

    const quote = makeElement("blockquote");
    quote.appendChild(makeElement("p", `"${data.quote}"`));
    quote.appendChild(makeElement("p", `- ${data.quoteAuthor}`));
    introduction.appendChild(quote);

    // Links separated by the chosen divider
    const links = makeElement("p");
    data.links.forEach((linkData, index) => {
        if (index > 0) {
            links.appendChild(document.createTextNode(` ${data.divider} `));
        }
        const link = makeElement("a", linkData.name);
        link.href = linkData.url;
        link.target = "_blank";
        links.appendChild(link);
    });
    introduction.appendChild(links);

    const acknowledgment = makeElement("p");
    acknowledgment.appendChild(makeElement("em", `${data.acknowledgmentStatement} (${data.acknowledgmentDate})`));
    introduction.appendChild(acknowledgment);

    return introduction;
}

// Replaces the form with the given content, plus a reset link at the bottom
function showResult(content) {
    resultContainer.replaceChildren(content);

    const resetLink = makeElement("a", "Reset and fill out the form again");
    resetLink.href = "#";
    resetLink.addEventListener("click", (e) => {
        e.preventDefault();
        resetProgress();
    });
    const resetWrapper = makeElement("p");
    resetWrapper.appendChild(resetLink);
    resultContainer.appendChild(resetWrapper);

    formElement.hidden = true;
    formHeading.hidden = true;
    resultContainer.hidden = false;
    window.scrollTo(0, 0);
}

// Shows generated code under a heading, inside a styled code block
function showCode(title, code) {
    // div: groups the code heading and code block so they replace the form together
    const wrapper = makeElement("div");
    wrapper.appendChild(makeElement("h3", title));
    const pre = makeElement("pre");
    pre.className = "code-output";
    pre.appendChild(makeElement("code", code));
    wrapper.appendChild(pre);
    showResult(wrapper);
}

// Escapes text so it can be shown safely inside HTML or XML
function escapeMarkup(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

// Turns an element into indented HTML: short elements stay on one line, others put each child on its own line
function formatHtml(node, depth) {
    const pad = "    ".repeat(depth);
    if (node.nodeType === Node.TEXT_NODE) {
        return pad + escapeMarkup(node.textContent);
    }
    const inlineTags = ["A", "STRONG", "EM"];
    const children = [...node.childNodes].filter((child) => child.nodeType === Node.ELEMENT_NODE || child.textContent.trim());
    const isSimple = children.every((child) => child.nodeType === Node.TEXT_NODE || inlineTags.includes(child.tagName));
    if (isSimple) {
        return pad + node.outerHTML;
    }
    const tag = node.tagName.toLowerCase();
    const attributes = [...node.attributes].map((attribute) => ` ${attribute.name}="${escapeMarkup(attribute.value)}"`).join("");
    const inner = children.map((child) => formatHtml(child, depth + 1)).join("\n");
    return `${pad}<${tag}${attributes}>\n${inner}\n${pad}</${tag}>`;
}

// Turns a value into indented XML; lists repeat a singular tag for each item (courses -> course)
function formatXml(tag, value, depth) {
    const pad = "    ".repeat(depth);
    if (Array.isArray(value)) {
        const itemTag = tag.replace(/s$/, "");
        const items = value.map((item) => formatXml(itemTag, item, depth + 1)).join("\n");
        return `${pad}<${tag}>\n${items}\n${pad}</${tag}>`;
    }
    if (typeof value === "object") {
        const fields = Object.entries(value).map(([key, fieldValue]) => formatXml(key, fieldValue, depth + 1)).join("\n");
        return `${pad}<${tag}>\n${fields}\n${pad}</${tag}>`;
    }
    return `${pad}<${tag}>${escapeMarkup(value)}</${tag}>`;
}

function generateHtml() {
    if (validateForm()) {
        const introduction = buildIntroduction(gatherData(false));
        const code = [...introduction.children].map((child) => formatHtml(child, 0)).join("\n");
        showCode("Introduction HTML", code);
    }
}

// Turns a YYYY-MM-DD date into M/D/YY, like 8/20/26
function formatShortDate(text) {
    if (!isRealDate(text)) {
        return text;
    }
    const [year, month, day] = text.split("-").map(Number);
    return `${month}/${day}/${String(year).slice(-2)}`;
}

// Rearranges the form data into the JSON structure the assignment asks for
function toIntroductionJson(data) {
    return {
        firstName: data.firstName,
        middleName: data.middleName,
        nickname: data.nickname,
        lastName: data.lastName,
        acknowledgment: data.acknowledgmentStatement,
        acknowledgmentDate: formatShortDate(data.acknowledgmentDate),
        prettyNameDivider: data.divider,
        adjectives: data.mascotAdjective,
        animal: data.mascotAnimal,
        img: data.picture.source,
        pictureAlt: data.picture.caption,
        caption: data.picture.caption,
        personalInfo: {
            statement: data.personalStatement,
            personalBackground: data.personalBackground,
            professionalBackground: data.professionalBackground,
            academicBackground: data.academicBackground,
            primaryWorkComputer: data.primaryComputer,
            primaryWorkLocation: data.primaryLocation,
            alternateComputerLocation: data.alternateComputer
        },
        courses: data.courses.map((course) => ({
            department: course.department,
            courseNumber: course.number,
            courseTitle: course.name,
            reasonForTaking: course.reason
        })),
        quote: data.quote,
        quoteAuthor: data.quoteAuthor,
        funnyItem: data.funnyThing,
        somethingToShare: data.somethingToShare,
        footerLinks: data.links.map((link) => ({
            label: link.name,
            url: link.url
        }))
    };
}

function generateJson() {
    if (validateForm()) {
        showCode("Introduction JSON", JSON.stringify(toIntroductionJson(gatherData(false)), null, 2));
    }
}

function generateXml() {
    if (validateForm()) {
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n${formatXml("introduction", toIntroductionJson(gatherData(false)), 0)}`;
        showCode("Introduction XML", xml);
    }
}

formElement.addEventListener("submit", () => {
    if (validateForm()) {
        showResult(buildIntroduction(gatherData(true)));
    }
});

// The Reset button also removes any courses that were added
formElement.addEventListener("reset", removeAddedCourses);

addCourseButton.addEventListener("click", addCourse);
clearButton.addEventListener("click", clearForm);
generateHtmlButton.addEventListener("click", generateHtml);
generateJsonButton.addEventListener("click", generateJson);
generateXmlButton.addEventListener("click", generateXml);
