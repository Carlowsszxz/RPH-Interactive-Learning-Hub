import { supabase } from './supabase-auth.js';

// Get topic ID from URL
const topicId = new URLSearchParams(location.search).get('topic');
const classId = new URLSearchParams(location.search).get('class');

if (!topicId) {
  document.body.innerHTML = '<div style="padding: 2rem; text-align: center;"><p>Error: No topic specified</p></div>';
}

// DOM elements
const backLink = document.getElementById('backLink');
const classLink = document.getElementById('classLink');
const topicBreadcrumb = document.getElementById('topicBreadcrumb');
const topicTitle = document.getElementById('topicTitle');
const className = document.getElementById('className');
const topicDescription = document.getElementById('topicDescription');
const topicContent = document.getElementById('topicContent');
const imageGallery = document.getElementById('imageGallery');
const filesGrid = document.getElementById('filesGrid');
const descriptionSection = document.getElementById('descriptionSection');
const contentSection = document.getElementById('contentSection');
const imagesSection = document.getElementById('imagesSection');
const documentsSection = document.getElementById('documentsSection');
const noResourcesSection = document.getElementById('noResourcesSection');

function escapeHTML(s) {
  if (!s) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function loadTopicDetail() {
  try {
    // Fetch topic
    const { data: topic, error: topicError } = await supabase
      .from('topics')
      .select('id, class_id, title, description, content, display_order, created_at')
      .eq('id', topicId)
      .single();

    if (topicError) {
      console.error('Error loading topic:', topicError);
      document.body.innerHTML = '<div style="padding: 2rem; text-align: center;"><p>Error: Topic not found</p></div>';
      return;
    }

    // Fetch class info
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('id, class_name')
      .eq('id', topic.class_id)
      .single();

    if (classError) {
      console.error('Error loading class:', classError);
    }

    // Fetch resources for this topic
    const { data: resources, error: resourcesError } = await supabase
      .from('class_resources')
      .select('id, title, description, resource_url, resource_type, created_at')
      .eq('topic_id', topicId)
      .order('created_at', { ascending: false });

    if (resourcesError) {
      console.error('Error loading resources:', resourcesError);
    }

    // Set class info
    if (classData) {
      className.textContent = classData.class_name;
      classLink.textContent = classData.class_name;
      classLink.href = `/TEMPLATES/FrameClassDetail.html?id=${classData.id}`;
    }

    backLink.href = `/TEMPLATES/FrameClassDetail.html?id=${topic.class_id}`;

    // Set topic info
    topicTitle.textContent = topic.title;
    topicBreadcrumb.textContent = topic.title;

    // Show description section
    if (topic.description) {
      topicDescription.textContent = topic.description;
      descriptionSection.style.display = 'block';
    }

    // Show content section
    if (topic.content) {
      topicContent.textContent = topic.content;
      contentSection.style.display = 'block';
    }

    // Process resources
    if (resources && resources.length > 0) {
      const images = resources.filter(r => r.resource_type === 'image');
      const documents = resources.filter(r => r.resource_type !== 'image');

      // Render images
      if (images.length > 0) {
        imageGallery.innerHTML = images.map(img => `
          <div class="gallery-item">
            <div class="gallery-image-wrapper">
              <img src="${escapeHTML(img.resource_url)}" alt="${escapeHTML(img.title)}" />
              <div class="gallery-overlay">
                <a href="${escapeHTML(img.resource_url)}" target="_blank" class="gallery-overlay-btn">
                  View Full Size
                </a>
              </div>
            </div>
            ${img.description ? `<div class="gallery-info"><p class="gallery-desc">${escapeHTML(img.description)}</p></div>` : ''}
          </div>
        `).join('');
        imagesSection.style.display = 'block';
      }

      // Render documents/files
      if (documents.length > 0) {
        filesGrid.innerHTML = documents.map(doc => {
          const icon = doc.resource_type === 'document' ? 'file-text' : 'file';
          return `
            <a href="${escapeHTML(doc.resource_url)}" target="_blank" class="file-item" title="${escapeHTML(doc.title)}">
              <div class="file-icon">
                <i data-lucide="${icon}"></i>
              </div>
              <div class="file-name">${escapeHTML(doc.title)}</div>
            </a>
          `;
        }).join('');
        documentsSection.style.display = 'block';
      }

      // If no sections were shown
      if (images.length === 0 && documents.length === 0) {
        noResourcesSection.style.display = 'block';
      }
    } else {
      noResourcesSection.style.display = 'block';
    }

    // Render lucide icons
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  } catch (err) {
    console.error('Error:', err);
    document.body.innerHTML = '<div style="padding: 2rem; text-align: center;"><p>Error loading topic details</p></div>';
  }
}

loadTopicDetail();
