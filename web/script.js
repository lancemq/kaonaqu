// 考哪去 - 上海中考信息平台
// JavaScript功能实现

class KaonaquApp {
    constructor() {
        this.districts = [];
        this.schools = [];
        this.policies = [];
        this.currentDistrict = null;
        this.init();
    }

    async init() {
        try {
            // 加载数据
            await this.loadData();
            // 初始化UI
            this.initUI();
            // 绑定事件
            this.bindEvents();
        } catch (error) {
            console.error('初始化失败:', error);
            this.showError('应用初始化失败，请刷新页面重试');
        }
    }

    async loadData() {
        // 模拟从API加载数据
        this.districts = [
            {
                id: 'pudong',
                name: '浦东新区',
                description: '上海面积最大、人口最多的区，教育资源丰富',
                schoolCount: 45,
                keySchools: ['建平中学', '进才中学', '华师大二附中']
            },
            {
                id: 'xuhui',
                name: '徐汇区',
                description: '教育强区，名校云集',
                schoolCount: 28,
                keySchools: ['南洋模范中学', '位育中学', '市二中学']
            },
            {
                id: 'jingan',
                name: '静安区',
                description: '中心城区，优质教育资源集中',
                schoolCount: 22,
                keySchools: ['市西中学', '育才中学', '华东模范中学']
            },
            {
                id: 'huangpu',
                name: '黄浦区',
                description: '历史悠久，教育底蕴深厚',
                schoolCount: 18,
                keySchools: ['格致中学', '大同中学', '向明中学']
            },
            {
                id: 'changning',
                name: '长宁区',
                description: '国际化程度高，教育质量优秀',
                schoolCount: 16,
                keySchools: ['市三女中', '延安中学', '天山中学']
            },
            {
                id: 'putuo',
                name: '普陀区',
                description: '教育资源均衡发展',
                schoolCount: 20,
                keySchools: ['曹杨二中', '晋元高级中学', '宜川中学']
            },
            {
                id: 'zhabei',
                name: '闸北区',
                description: '教育资源不断提升',
                schoolCount: 15,
                keySchools: ['新中高级中学', '市北中学', '风华中学']
            },
            {
                id: 'hongkou',
                name: '虹口区',
                description: '文化底蕴深厚，教育特色鲜明',
                schoolCount: 17,
                keySchools: ['复兴高级中学', '北郊高级中学', '虹口高级中学']
            },
            {
                id: 'yangpu',
                name: '杨浦区',
                description: '高校资源丰富，教育氛围浓厚',
                schoolCount: 21,
                keySchools: ['复旦附中', '交大附中', '控江中学']
            },
            {
                id: 'minhang',
                name: '闵行区',
                description: '新兴教育区域，发展潜力大',
                schoolCount: 32,
                keySchools: ['七宝中学', '莘庄中学', '闵行中学']
            },
            {
                id: 'baoshan',
                name: '宝山区',
                description: '教育资源稳步提升',
                schoolCount: 25,
                keySchools: ['行知中学', '吴淞中学', '通河中学']
            },
            {
                id: 'jiading',
                name: '嘉定区',
                description: '历史文化名城，教育传统优良',
                schoolCount: 19,
                keySchools: ['嘉定一中', '中光高级中学', '疁城实验学校']
            },
            {
                id: 'songjiang',
                name: '松江区',
                description: '大学城所在地，教育资源丰富',
                schoolCount: 23,
                keySchools: ['松江二中', '松江一中', '上外松江外国语']
            },
            {
                id: 'qingpu',
                name: '青浦区',
                description: '生态宜居，教育发展迅速',
                schoolCount: 18,
                keySchools: ['青浦高级中学', '朱家角中学', '青浦一中']
            },
            {
                id: 'fengxian',
                name: '奉贤区',
                description: '教育资源均衡发展',
                schoolCount: 16,
                keySchools: ['奉贤中学', '曙光中学', '奉贤二中']
            },
            {
                id: 'jinshan',
                name: '金山区',
                description: '教育资源稳步提升',
                schoolCount: 14,
                keySchools: ['金山中学', '华师大三附中', '张堰中学']
            },
            {
                id: 'chongming',
                name: '崇明区',
                description: '生态岛，教育特色发展',
                schoolCount: 12,
                keySchools: ['崇明中学', '民本中学', '扬子中学']
            }
        ];

        this.schools = [
            {
                id: 'jianping',
                name: '建平中学',
                district: 'pudong',
                type: '市重点',
                address: '浦东新区崮山路519号',
                phone: '021-58791234',
                website: 'http://www.jianping.sh.cn',
                features: ['科技创新', '艺术教育', '国际交流'],
                admissionScore: 580,
                enrollment: 800
            },
            {
                id: 'jincain',
                name: '进才中学',
                district: 'pudong',
                type: '市重点',
                address: '浦东新区杨高中路2488号',
                phone: '021-58795678',
                website: 'http://www.jincain.sh.cn',
                features: ['外语特色', '体育特长', '社团活动'],
                admissionScore: 575,
                enrollment: 750
            },
            {
                id: 'nanyang',
                name: '南洋模范中学',
                district: 'xuhui',
                type: '市重点',
                address: '徐汇区零陵路453号',
                phone: '021-64331234',
                website: 'http://www.nanyang.sh.cn',
                features: ['理科竞赛', '篮球传统', '学术研究'],
                admissionScore: 585,
                enrollment: 600
            },
            {
                id: 'weiyu',
                name: '位育中学',
                district: 'xuhui',
                type: '市重点',
                address: '徐汇区华泾路698号',
                phone: '021-64335678',
                website: 'http://www.weiyu.sh.cn',
                features: ['文科优势', '科技创新', '国际课程'],
                admissionScore: 578,
                enrollment: 650
            },
            {
                id: 'shixi',
                name: '市西中学',
                district: 'jingan',
                type: '市重点',
                address: '静安区愚园路404号',
                phone: '021-62481234',
                website: 'http://www.shixi.sh.cn',
                features: ['思辨教育', '艺术特色', '国际视野'],
                admissionScore: 582,
                enrollment: 550
            }
        ];

        this.policies = [
            {
                id: '2026-general',
                title: '2026年上海市中考招生政策总览',
                year: 2026,
                publishDate: '2026-01-15',
                summary: '2026年上海市中考招生政策总体框架和主要变化',
                content: '2026年上海市中考将继续实行"两考合一"制度，学业水平考试与升学考试合并进行。总分仍为750分，包括语文、数学、英语、物理、化学、道德与法治、历史、体育等科目。'
            },
            {
                id: '2026-district',
                title: '2026年各区招生名额分配政策',
                year: 2026,
                publishDate: '2026-02-01',
                summary: '各区市重点高中名额分配到校政策详解',
                content: '2026年继续实施名额分配综合评价录取，市实验性示范性高中将65%的招生计划分配到各区，其中70%分配到不选择生源的初中学校。'
            },
            {
                id: '2026-special',
                title: '2026年特长生招生政策',
                year: 2026,
                publishDate: '2026-02-10',
                summary: '艺术、体育、科技特长生招生政策',
                content: '具有艺术、体育、科技等方面特长的考生可申请特长生招生，需参加专业测试并通过文化课最低控制线。'
            }
        ];
    }

    initUI() {
        this.renderDistrictList();
        this.renderSchoolList();
        this.renderPolicyList();
    }

    bindEvents() {
        // 区域筛选
        document.querySelectorAll('.district-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const districtId = e.currentTarget.dataset.district;
                this.filterSchoolsByDistrict(districtId);
            });
        });

        // 搜索功能
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchSchools(e.target.value);
            });
        }

        // 政策筛选
        document.querySelectorAll('.policy-year').forEach(item => {
            item.addEventListener('click', (e) => {
                const year = e.currentTarget.dataset.year;
                this.filterPoliciesByYear(year);
            });
        });
    }

    renderDistrictList() {
        const container = document.getElementById('district-list');
        if (!container) return;

        const html = this.districts.map(district => `
            <div class="district-item" data-district="${district.id}">
                <h3>${district.name}</h3>
                <p>${district.description}</p>
                <div class="district-stats">
                    <span>中学数量: ${district.schoolCount}所</span>
                    <span>重点中学: ${district.keySchools.join(', ')}</span>
                </div>
            </div>
        `).join('');

        container.innerHTML = html;
    }

    renderSchoolList() {
        const container = document.getElementById('school-list');
        if (!container) return;

        const html = this.schools.map(school => `
            <div class="school-card" data-district="${school.district}">
                <div class="school-header">
                    <h3>${school.name}</h3>
                    <span class="school-type">${school.type}</span>
                </div>
                <div class="school-info">
                    <p><strong>地址:</strong> ${school.address}</p>
                    <p><strong>电话:</strong> ${school.phone}</p>
                    <p><strong>特色:</strong> ${school.features.join(', ')}</p>
                    <p><strong>预估分数线:</strong> ${school.admissionScore}分</p>
                    <p><strong>招生人数:</strong> ${school.enrollment}人</p>
                </div>
                <div class="school-actions">
                    <a href="${school.website}" target="_blank" class="btn btn-primary">官网</a>
                    <button class="btn btn-secondary">收藏</button>
                </div>
            </div>
        `).join('');

        container.innerHTML = html;
    }

    renderPolicyList() {
        const container = document.getElementById('policy-list');
        if (!container) return;

        const html = this.policies.map(policy => `
            <div class="policy-item">
                <div class="policy-header">
                    <h3>${policy.title}</h3>
                    <span class="policy-year-tag">${policy.year}年</span>
                </div>
                <div class="policy-content">
                    <p class="policy-summary">${policy.summary}</p>
                    <p class="policy-date">发布日期: ${policy.publishDate}</p>
                    <div class="policy-details">
                        ${policy.content}
                    </div>
                </div>
                <button class="btn btn-outline" onclick="togglePolicyDetails(this)">查看详情</button>
            </div>
        `).join('');

        container.innerHTML = html;
    }

    filterSchoolsByDistrict(districtId) {
        const schoolCards = document.querySelectorAll('.school-card');
        schoolCards.forEach(card => {
            if (districtId === 'all' || card.dataset.district === districtId) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }

    searchSchools(keyword) {
        const schoolCards = document.querySelectorAll('.school-card');
        const lowerKeyword = keyword.toLowerCase();

        schoolCards.forEach(card => {
            const schoolName = card.querySelector('h3').textContent.toLowerCase();
            const schoolInfo = card.querySelector('.school-info').textContent.toLowerCase();
            
            if (schoolName.includes(lowerKeyword) || schoolInfo.includes(lowerKeyword)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }

    filterPoliciesByYear(year) {
        const policyItems = document.querySelectorAll('.policy-item');
        policyItems.forEach(item => {
            const policyYear = item.querySelector('.policy-year-tag').textContent.replace('年', '');
            if (year === 'all' || policyYear === year) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }
}

// 全局函数
function togglePolicyDetails(button) {
    const details = button.previousElementSibling.querySelector('.policy-details');
    const isHidden = details.style.display === 'none';
    
    details.style.display = isHidden ? 'block' : 'none';
    button.textContent = isHidden ? '收起详情' : '查看详情';
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new KaonaquApp();
});

// 响应式导航
function toggleMenu() {
    const nav = document.querySelector('.nav-menu');
    nav.classList.toggle('active');
}