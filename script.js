class KaonaquApp {
    constructor() {
        this.districts = [];
        this.schools = [];
        this.policies = [];
        this.news = [];
        this.activeDistrict = 'all';
        this.searchQuery = '';
        this.activeNewsFilter = 'all';
        this.pageType = document.body.dataset.page || 'home';
        this.activeSchoolId = '';
    }

    async init() {
        try {
            this.assertSupportedAccessMode();
            await this.loadData();
            this.syncSchoolFromUrl();
            this.bindEvents();
            this.render();
        } catch (error) {
            this.showFatalError(error);
        }
    }

    assertSupportedAccessMode() {
        if (window.location.protocol === 'file:') {
            throw new Error('检测到你是直接打开 HTML 文件。请先在项目根目录运行 `npm start`，然后通过 http://localhost:8080 访问页面。');
        }
    }

    async loadData() {
        const [districts, schools, policies, news] = await Promise.all([
            this.fetchJson('/api/districts'),
            this.fetchJson('/api/schools'),
            this.fetchJson('/api/policies'),
            this.fetchJson('/api/news')
        ]);

        this.districts = districts;
        this.schools = schools;
        this.policies = policies;
        this.news = news;
    }

    async fetchJson(url) {
        let response;
        try {
            response = await fetch(url);
        } catch (error) {
            throw new Error(`无法请求 ${url}。请确认本地服务已启动，并使用 http://localhost:8080 访问页面。`);
        }

        if (!response.ok) {
            let detail = '';
            try {
                const payload = await response.json();
                detail = payload.error ? `，错误信息：${payload.error}` : '';
            } catch (error) {
                detail = '';
            }
            throw new Error(`请求失败: ${url}，状态码 ${response.status}${detail}`);
        }

        return response.json();
    }

    bindEvents() {
        const districtFilter = document.getElementById('district-filter');
        const searchInput = document.getElementById('search-input');
        const resetButton = document.getElementById('reset-filters');
        const searchTrigger = document.getElementById('search-trigger');
        const quickChips = document.querySelectorAll('[data-query]');
        const newsFilters = document.querySelectorAll('[data-news-filter]');

        if (districtFilter && searchInput && resetButton && searchTrigger) {
            districtFilter.addEventListener('change', (event) => {
                this.activeDistrict = event.target.value;
                this.render();
            });

            searchInput.addEventListener('input', (event) => {
                this.searchQuery = event.target.value.trim().toLowerCase();
                this.render();
            });

            searchInput.addEventListener('keydown', (event) => {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    document.getElementById('schools')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });

            searchTrigger.addEventListener('click', () => {
                this.searchQuery = searchInput.value.trim().toLowerCase();
                this.render();
                document.getElementById('schools')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });

            resetButton.addEventListener('click', () => {
                this.activeDistrict = 'all';
                this.searchQuery = '';
                districtFilter.value = 'all';
                searchInput.value = '';
                this.render();
            });

            quickChips.forEach((button) => {
                button.addEventListener('click', () => {
                    const query = button.dataset.query || '';
                    this.searchQuery = query.toLowerCase();
                    searchInput.value = query;
                    this.render();
                    document.getElementById('schools')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                });
            });
        }

        newsFilters.forEach((button) => {
            button.addEventListener('click', () => {
                this.activeNewsFilter = button.dataset.newsFilter || 'all';
                this.render();
            });
        });

        window.addEventListener('popstate', () => {
            this.syncSchoolFromUrl();
            this.render();
        });
    }

    getSchoolDistrictId(school) {
        return school.districtId || this.mapDistrictNameToId(school.district || school.districtName);
    }

    getSchoolDistrictName(school) {
        return school.district || school.districtName || '未知区域';
    }

    getSchoolType(school) {
        return school.type || school.schoolTypeLabel || '未分类';
    }

    getSchoolStage(school) {
        return school.schoolStageLabel || (school.schoolStage === 'junior' ? '初中' : '高中');
    }

    getSchoolStageBadgeClass(school) {
        if (school.schoolStage === 'junior') {
            return 'stage-badge-junior';
        }
        if (school.schoolStage === 'complete') {
            return 'stage-badge-complete';
        }
        return 'stage-badge-senior';
    }

    getSchoolFeatures(school) {
        return school.keyFeatures || school.features || [];
    }

    getSchoolTags(school) {
        return school.tags || [];
    }

    getSchoolAdmissionInfo(school) {
        return school.admissionInfo || school.admissionNotes || '暂无';
    }

    getPolicyExamType(policy) {
        const haystack = [
            policy.title,
            policy.summary,
            policy.content
        ].join(' ').toLowerCase();

        if (haystack.includes('高考') || haystack.includes('高校') || haystack.includes('春考')) {
            return 'gaokao';
        }

        return 'zhongkao';
    }

    getSchoolFeatureTags(school) {
        const tags = [...this.getSchoolTags(school), ...this.getSchoolFeatures(school)];
        return tags.slice(0, 4);
    }

    getNewsSection(item) {
        if (item.newsType) {
            return item.newsType;
        }

        if (item.examType === 'zhongkao' || item.examType === 'gaokao') {
            return 'exam';
        }

        return 'exam';
    }

    getNewsCategoryLabel(item) {
        return item.category || (this.getNewsSection(item) === 'exam' ? '考试新闻' : '新闻');
    }

    getFilteredNews() {
        return this.news
            .filter((item) => this.activeNewsFilter === 'all' || this.getNewsSection(item) === this.activeNewsFilter)
            .sort((left, right) => String(right.publishedAt || '').localeCompare(String(left.publishedAt || '')));
    }

    getLatestNewsByExamType(examType) {
        return this.news
            .filter((item) => item.examType === examType)
            .sort((left, right) => String(right.publishedAt || '').localeCompare(String(left.publishedAt || '')))[0] || null;
    }

    getFilteredSchools() {
        return this.schools.filter((school) => {
            const districtMatched = this.activeDistrict === 'all' || this.getSchoolDistrictId(school) === this.activeDistrict;
            if (!districtMatched) {
                return false;
            }

            if (!this.searchQuery) {
                return true;
            }

            const haystack = [
                school.name,
                this.getSchoolDistrictName(school),
                this.getSchoolStage(school),
                this.getSchoolType(school),
                school.tier,
                school.address,
                this.getSchoolAdmissionInfo(school),
                ...this.getSchoolFeatures(school),
                ...this.getSchoolTags(school)
            ].join(' ').toLowerCase();

            return haystack.includes(this.searchQuery);
        });
    }

    getFilteredPolicies() {
        return this.policies.filter((policy) => {
            const policyDistrict = policy.districtId || policy.district || 'all';
            return this.activeDistrict === 'all' || policyDistrict === 'all' || policyDistrict === this.activeDistrict;
        });
    }

    mapDistrictNameToId(name) {
        const district = this.districts.find((item) => item.name === name || item.districtName === name);
        return district ? district.id : name;
    }

    render() {
        const schools = this.getFilteredSchools();
        const policies = this.getFilteredPolicies();
        const news = this.getFilteredNews();

        if (this.pageType === 'home') {
            this.renderHome(news, schools);
            return;
        }

        if (this.pageType === 'news') {
            this.renderNewsPage(news, policies);
            return;
        }

        this.renderSchoolsPage(schools, policies, news);
    }

    renderHome(news, schools) {
        this.renderHomeNews(news);
        this.renderHomeSchools(schools);
    }

    renderNewsPage(news, policies) {
        this.renderNews(news, 'news-featured', 'news-list', 5);
        this.renderPolicies(policies);
    }

    renderSchoolsPage(schools, policies, news) {
        this.renderDistrictFilter();
        this.renderDistricts('district-list');
        this.renderSchools(schools, 'school-list');
        this.renderSchoolDetail();
        this.renderStats(schools.length);
        this.renderResultSummary(schools.length, news.length);
    }

    syncSchoolFromUrl() {
        const params = new URLSearchParams(window.location.search);
        this.activeSchoolId = params.get('school') || '';
    }

    updateSchoolUrl() {
        const url = new URL(window.location.href);
        if (this.activeSchoolId) {
            url.searchParams.set('school', this.activeSchoolId);
        } else {
            url.searchParams.delete('school');
        }
        window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
    }

    openSchoolDetail(schoolId) {
        this.activeSchoolId = schoolId;
        this.updateSchoolUrl();
        this.render();
        document.getElementById('school-detail-view')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    closeSchoolDetail() {
        this.activeSchoolId = '';
        this.updateSchoolUrl();
        this.render();
    }

    renderDistrictFilter() {
        const select = document.getElementById('district-filter');
        if (!select) {
            return;
        }
        const options = [
            '<option value="all">全部区域</option>',
            ...this.districts.map((district) => `<option value="${district.id}">${district.name || district.districtName}</option>`)
        ];

        select.innerHTML = options.join('');
        select.value = this.activeDistrict;
    }

    renderDistricts(containerId = 'district-list') {
        const container = document.getElementById(containerId);
        if (!container) {
            return;
        }
        container.innerHTML = this.districts.map((district) => {
            const activeClass = this.activeDistrict === district.id ? ' district-card-active' : '';
            const name = district.name || district.districtName;
            const count = district.schoolCount || district.count || 0;
            return `
                <button class="district-card${activeClass}" data-district-id="${district.id}" type="button">
                    <div class="district-card-header">
                        <div>
                            <h3>${name}</h3>
                            <p class="district-card-caption">区域学校概览</p>
                        </div>
                        <span class="pill district-count-pill">${count} 所</span>
                    </div>
                    <p>${district.description || '暂无说明'}</p>
                    <p class="district-meta">点击查看该区域学校列表与学校特色。</p>
                </button>
            `;
        }).join('');

        container.querySelectorAll('[data-district-id]').forEach((button) => {
            button.addEventListener('click', () => {
                this.activeDistrict = button.dataset.districtId;
                document.getElementById('district-filter').value = this.activeDistrict;
                this.render();
            });
        });
    }

    renderNews(news, featuredId, listId, listCount) {
        const container = document.getElementById(listId);
        const featured = document.getElementById(featuredId);
        if (!container || !featured) {
            return;
        }

        document.querySelectorAll('[data-news-filter]').forEach((button) => {
            button.classList.toggle('news-filter-active', button.dataset.newsFilter === this.activeNewsFilter);
        });

        if (!news.length) {
            featured.innerHTML = '';
            container.innerHTML = this.getEmptyState();
            return;
        }

        const [headline, ...items] = news;

        featured.innerHTML = `
            <article class="featured-news-card">
                <div class="news-meta-row">
                    <span class="pill">${this.getNewsCategoryLabel(headline)}</span>
                    <span class="news-date">${headline.publishedAt || '暂无日期'}</span>
                </div>
                <h3>${headline.title}</h3>
                <p class="news-summary">${headline.summary || '暂无摘要'}</p>
                <p class="news-source">来源：${headline.source?.name || '未知'} · 可信度 ${this.formatConfidence(headline.source?.confidence)}</p>
                ${headline.source?.url ? `<a class="text-link" href="${headline.source.url}" target="_blank" rel="noreferrer">查看原文</a>` : ''}
            </article>
        `;

        container.innerHTML = items.slice(0, listCount).map((item) => `
            <article class="news-card">
                <div class="news-card-header">
                    <div class="news-meta-row">
                        <span class="pill">${this.getNewsCategoryLabel(item)}</span>
                        <span class="news-date">${item.publishedAt || '暂无日期'}</span>
                    </div>
                    <h3>${item.title}</h3>
                </div>
                <p class="news-summary">${item.summary || '暂无摘要'}</p>
                <p class="news-source">来源：${item.source?.name || '未知'} · 可信度 ${this.formatConfidence(item.source?.confidence)}</p>
                ${item.source?.url ? `<a class="text-link" href="${item.source.url}" target="_blank" rel="noreferrer">查看原文</a>` : ''}
            </article>
        `).join('');
    }

    renderHomeNews(news) {
        this.renderNews(news, 'home-news-featured', 'home-news-list', 3);
    }

    renderHomeSchools(schools) {
        this.renderDistrictPreviews();
        const topSchools = schools.slice(0, 15);
        this.renderSchools(topSchools, 'home-school-list');
    }

    renderDistrictPreviews() {
        const container = document.getElementById('home-district-list');
        if (!container) {
            return;
        }

        container.innerHTML = this.districts.slice(0, 6).map((district) => `
            <article class="district-preview-card">
                <h3>${district.name || district.districtName}</h3>
                <p>${district.description || '暂无说明'}</p>
            </article>
        `).join('');
    }

    renderSchools(schools, containerId = 'school-list') {
        const container = document.getElementById(containerId);
        if (!container) {
            return;
        }
        if (!schools.length) {
            container.innerHTML = this.getEmptyState();
            return;
        }

        const schoolContextNews = this.getLatestNewsByExamType('zhongkao');
        const isDirectoryView = this.pageType === 'schools' && containerId === 'school-list';

        container.innerHTML = schools.map((school) => `
            <article class="school-card">
                <div class="school-card-topline">
                    <span class="school-record-label">学校档案</span>
                    <span class="school-record-district">${this.getSchoolDistrictName(school)}</span>
                </div>
                <div class="school-card-header">
                    <div>
                        <h3>${school.name}</h3>
                        <p>${school.address || '暂无地址信息'}</p>
                    </div>
                    <div class="school-card-badges">
                        <span class="stage-badge ${this.getSchoolStageBadgeClass(school)}">${this.getSchoolStage(school)}</span>
                        <span class="pill school-type-pill">${this.getSchoolType(school)}</span>
                    </div>
                </div>
                <p class="school-summary">${this.getSchoolAdmissionInfo(school)}</p>
                <div class="school-data-grid">
                    <div class="school-data-item">
                        <span>区域</span>
                        <strong>${this.getSchoolDistrictName(school)}</strong>
                    </div>
                    <div class="school-data-item">
                        <span>梯队</span>
                        <strong>${school.tier ? `${school.tier} 梯队` : '暂无'}</strong>
                    </div>
                    <div class="school-data-item">
                        <span>来源</span>
                        <strong>${school.source?.name || '未知'}</strong>
                    </div>
                    <div class="school-data-item">
                        <span>可信度</span>
                        <strong>${this.formatConfidence(school.source?.confidence)}</strong>
                    </div>
                </div>
                <div class="school-highlights">
                    ${this.getSchoolFeatureTags(school).map((feature) => `<span class="meta-chip">${feature}</span>`).join('') || '<span class="meta-chip meta-chip-muted">暂无特色标签</span>'}
                </div>
                ${schoolContextNews ? `<p class="school-link-note">关联动态：${schoolContextNews.title}</p>` : ''}
                <div class="school-card-footer">
                    <p class="school-card-footnote">来源：${school.source?.name || '未知'} · 可信度 ${this.formatConfidence(school.source?.confidence)}</p>
                    <div class="school-card-actions">
                        ${isDirectoryView ? `<button class="action-button action-button-secondary school-detail-trigger" data-school-id="${school.id}" type="button">查看完整档案</button>` : ''}
                        ${school.website ? `<a class="school-card-enter" href="${school.website}" target="_blank" rel="noreferrer">查看学校网站</a>` : '<span class="school-card-enter">暂无官网链接</span>'}
                    </div>
                </div>
            </article>
        `).join('');

        if (isDirectoryView) {
            container.querySelectorAll('.school-detail-trigger').forEach((button) => {
                button.addEventListener('click', () => {
                    this.openSchoolDetail(button.dataset.schoolId);
                });
            });
        }
    }

    renderSchoolDetail() {
        const container = document.getElementById('school-detail-view');
        if (!container) {
            return;
        }

        if (!this.activeSchoolId) {
            container.hidden = true;
            container.innerHTML = '';
            return;
        }

        const school = this.schools.find((item) => item.id === this.activeSchoolId);
        if (!school) {
            container.hidden = true;
            container.innerHTML = '';
            return;
        }

        container.hidden = false;
        container.innerHTML = `
            <article class="panel school-detail-hero">
                <div class="school-detail-head">
                    <div class="school-detail-copy">
                        <div class="school-detail-kicker-row">
                            <span class="school-record-label">学校完整档案</span>
                            <span class="school-record-district">${this.getSchoolDistrictName(school)}</span>
                        </div>
                        <h1>${school.name}</h1>
                        <p>${school.schoolDescription || this.getSchoolAdmissionInfo(school) || '暂无学校说明。'}</p>
                        <div class="school-detail-chip-group">
                            <span class="stage-badge ${this.getSchoolStageBadgeClass(school)}">${this.getSchoolStage(school)}</span>
                            <span class="pill school-type-pill">${this.getSchoolType(school)}</span>
                            ${school.tier ? `<span class="pill">${school.tier} 梯队</span>` : ''}
                        </div>
                        <div class="school-detail-action-row">
                            ${school.website ? `<a class="action-button" href="${school.website}" target="_blank" rel="noreferrer">访问学校官网</a>` : ''}
                            <button class="action-button action-button-secondary" id="school-detail-close" type="button">关闭详情</button>
                        </div>
                    </div>
                    <div class="school-detail-metrics">
                        <article>
                            <span>所在区域</span>
                            <strong>${this.getSchoolDistrictName(school)}</strong>
                        </article>
                        <article>
                            <span>学校阶段</span>
                            <strong>${this.getSchoolStage(school)}</strong>
                        </article>
                        <article>
                            <span>信息可信度</span>
                            <strong>${this.formatConfidence(school.source?.confidence)}</strong>
                        </article>
                    </div>
                </div>
            </article>
            <div class="school-detail-fact-grid">
                <article class="school-detail-fact-card">
                    <h3>基础信息</h3>
                    <dl class="school-detail-facts">
                        <div><dt>学校类型</dt><dd>${this.getSchoolType(school)}</dd></div>
                        <div><dt>梯队</dt><dd>${school.tier ? `${school.tier} 梯队` : '暂无'}</dd></div>
                        <div><dt>地址</dt><dd>${school.address || '暂无'}</dd></div>
                        <div><dt>电话</dt><dd>${school.phone || '暂无'}</dd></div>
                    </dl>
                </article>
                <article class="school-detail-fact-card">
                    <h3>招生与查看建议</h3>
                    <p class="school-detail-note">${school.admissionRequirements || school.applicationTips || '暂无补充说明。'}</p>
                </article>
            </div>
            <div class="school-detail-feature-grid">
                <article class="school-detail-feature-card">
                    <h3>学校亮点</h3>
                    <p>${(school.schoolHighlights && school.schoolHighlights.length ? school.schoolHighlights.join(' ') : '暂无亮点说明。')}</p>
                </article>
                <article class="school-detail-feature-card">
                    <h3>适合学生</h3>
                    <p>${school.suitableStudents || '暂无适合人群说明。'}</p>
                </article>
            </div>
            <div class="school-detail-related-grid">
                <article class="school-detail-related-card">
                    <h3>特色标签</h3>
                    <div class="school-detail-chip-group">
                        ${this.getSchoolFeatureTags(school).map((feature) => `<span class="meta-chip">${feature}</span>`).join('') || '<span class="meta-chip meta-chip-muted">暂无特色标签</span>'}
                    </div>
                </article>
                <article class="school-detail-related-card">
                    <h3>来源信息</h3>
                    <p>来源：${school.source?.name || '未知'}${school.source?.crawledAt ? `，抓取时间：${school.source.crawledAt}` : ''}。</p>
                    ${school.source?.url ? `<a class="text-link" href="${school.source.url}" target="_blank" rel="noreferrer">查看原始来源</a>` : ''}
                </article>
            </div>
        `;

        container.querySelector('#school-detail-close')?.addEventListener('click', () => {
            this.closeSchoolDetail();
        });
    }

    renderPolicies(policies) {
        const container = document.getElementById('policy-list');
        if (!container) {
            return;
        }
        if (!policies.length) {
            container.innerHTML = this.getEmptyState();
            return;
        }

        container.innerHTML = policies.map((policy) => `
            <article class="policy-card">
                <div class="policy-card-header">
                    <h3>${policy.title}</h3>
                    <span class="pill">${policy.districtName || policy.district || '全市'}</span>
                </div>
                <p class="policy-summary">${policy.summary || '暂无摘要'}</p>
                <p class="policy-meta">${policy.year || ''}${policy.publishedAt ? ` | ${policy.publishedAt}` : ''}</p>
                <p class="policy-content">${policy.content || ''}</p>
                ${this.getLatestNewsByExamType(this.getPolicyExamType(policy)) ? `<p class="policy-link-note">相关动态：${this.getLatestNewsByExamType(this.getPolicyExamType(policy)).title}</p>` : ''}
                <p class="policy-source">来源：${policy.source?.name || '未知'} · 可信度 ${this.formatConfidence(policy.source?.confidence)}</p>
            </article>
        `).join('');
    }

    formatConfidence(value) {
        const score = typeof value === 'number' ? value : 0;
        return `${Math.round(score * 100)}%`;
    }

    renderStats(schoolCount) {
        const schoolCountNode = document.getElementById('school-count');
        const districtCountNode = document.getElementById('district-count');
        if (!schoolCountNode || !districtCountNode) {
            return;
        }
        schoolCountNode.textContent = String(schoolCount);
        districtCountNode.textContent = String(this.districts.length);
    }

    renderResultSummary(schoolCount, newsCount) {
        const summaryNode = document.getElementById('result-summary');
        if (!summaryNode) {
            return;
        }
        const districtName = this.activeDistrict === 'all'
            ? '全上海'
            : (this.districts.find((district) => district.id === this.activeDistrict)?.name || this.activeDistrict);
        const queryLabel = this.searchQuery ? `关键词“${this.searchQuery}”` : '全部关键词';
        summaryNode.textContent =
            `当前范围：${districtName}，匹配 ${schoolCount} 所学校，搜索条件为 ${queryLabel}。相关政策与考试动态已统一收纳到新闻政策模块，当前共可查看 ${newsCount} 条新闻。`;
    }

    getEmptyState() {
        return document.getElementById('empty-state-template').innerHTML;
    }

    showFatalError(error) {
        document.body.innerHTML = `
            <div class="fatal-error">
                <h1>页面初始化失败</h1>
                <p>请检查本地服务是否启动，以及数据文件是否可读取。</p>
                <pre>${error.message}</pre>
            </div>
        `;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const app = new KaonaquApp();
    app.init();
});
