// ===========================
// settings.js - Quản lý Đa ngôn ngữ & Tiền tệ (Updated for Dynamic Placeholders)
// ===========================

const UI_TRANSLATIONS = {
    vi: {
        // --- HEADER ---
        nav_home: "Trang chủ",
        nav_explore: "Khám phá",
        nav_top_reviews: "Khách sạn tốt nhất",
        nav_fav: "Yêu thích",
        btn_login: "Đăng nhập",
        btn_register: "Đăng ký",
        
        // --- SETTINGS MODAL ---
        modal_title: "Cài đặt khu vực",
        modal_lang: "Chọn ngôn ngữ",
        modal_curr: "Chọn tiền tệ",
        btn_save: "Lưu thay đổi",

        // --- HOME PAGE (SEARCH BAR) ---
        hero_title: "Khám phá chỗ ở phù hợp<br>cho bạn tại Việt Nam",
        placeholder_loc: "Địa điểm (Thành phố, khu vực...)",
        
        // ⭐ SỬA: Bỏ chữ (VND) cứng để code tự thêm động
        placeholder_min: "Giá tối thiểu", 
        placeholder_max: "Giá tối đa",

        stat_props: "Chỗ nghỉ",
        stat_provs: "Thành Phố",
        stat_rating: "Điểm đánh giá",
        why_title: "Tại sao chọn StayWise của chúng tôi?",
        feat_ai: "Đề xuất được hỗ trợ bởi AI",
        feat_ai_desc: "Nhận đề xuất được cá nhân hóa dựa trên sở thích và phong cách du lịch của bạn.",
        feat_verify: "Các chỗ nghỉ đã được xác minh",
        feat_verify_desc: "Tất cả chỗ nghỉ đều được xác minh và đánh giá bởi khách du lịch thực tế.",
        feat_support: "Hỗ trợ 24/7",
        feat_support_desc: "Đội ngũ của chúng tôi luôn sẵn sàng hỗ trợ bạn mọi thắc mắc.",
        pop_hotel_title: "Một số địa điểm lưu trú, chỗ ở được ưa chuộng",
        pop_hotel_sub: "Khám phá những nơi lưu trú được du khách lựa chọn kỹ lưỡng",
        pop_dest_title: "Các địa điểm du lịch nổi tiếng",

        // --- AUTH MODALS ---
        login_title: "Đăng nhập",
        login_subtitle: "Chào mừng quay trở lại với StayWise",
        label_email: "Email",
        label_password: "Mật khẩu",
        ph_email: "Nhập địa chỉ email của bạn",
        ph_password: "Nhập mật khẩu",
        btn_login_submit: "Đăng nhập",
        link_forgot_pass: "Quên mật khẩu?",
        text_no_account: "Bạn chưa có tài khoản?",
        link_register_here: "Hãy đăng ký tại đây.",
        text_or: "Hoặc",
        btn_login_google: "Đăng nhập bằng Google",
        btn_login_facebook: "Đăng nhập bằng Facebook",

        signup_title: "Đăng ký",
        signup_subtitle: "Chào mừng bạn đến với StayWise",
        label_fullname: "Họ và tên",
        ph_fullname: "Họ và tên của bạn",
        label_confirm_pass: "Xác nhận mật khẩu",
        ph_confirm_pass: "Nhập lại mật khẩu",
        btn_signup_submit: "Đăng ký",
        text_have_account: "Bạn đã có tài khoản?",
        link_login_here: "Hãy đăng nhập tại đây.",

        forgot_title: "Khôi phục mật khẩu",
        forgot_subtitle: "Nhập email đã đăng ký để nhận hướng dẫn đặt lại mật khẩu.",
        btn_send_request: "Gửi yêu cầu",
        link_back_login: "Quay lại Đăng nhập",

        // --- EXPLORE ---
        explore_hero_title: "KHÁM PHÁ CHỖ Ở",
        explore_hero_subtitle: "Tìm kiếm chỗ ở hoàn hảo từ hơn 10,000 nơi lưu trú",
        filter_title: "Bộ lọc",
        btn_reset_filter: "Xóa tất cả",
        lbl_location: "Tìm kiếm địa điểm",
        ph_location: "Thành phố hoặc khu vực...",
        lbl_stay_type: "Loại hình lưu trú",
        opt_all_types: "Tất cả loại hình",
        opt_hotel: "Khách sạn",
        opt_apartment: "Căn hộ",
        opt_resort: "Resort",
        opt_homestay: "Nhà nghỉ, homestay",
        opt_other: "Khác",
        lbl_price_range: "Khoảng giá (mỗi đêm)",
        ph_min: "Tối thiểu",
        ph_max: "Tối đa",
        lbl_rating: "Đánh giá",
        opt_all_ratings: "Tất cả",
        lbl_main_fac: "Tiện ích chính",
        fac_ac: "Máy lạnh",
        fac_restaurant: "Nhà hàng",
        fac_pool: "Hồ bơi",
        fac_24h: "Lễ tân 24h",
        fac_parking: "Chỗ đậu xe",
        fac_elevator: "Thang máy",
        lbl_extra_fac: "Tiện ích bổ sung",
        fac_gym: "Phòng tập",
        fac_laundry: "Dịch vụ giặt ủi",
        btn_apply: "ÁP DỤNG",
        sort_default: "Sắp xếp",
        sort_price_asc: "Tăng dần theo giá",
        sort_price_desc: "Giảm dần theo giá",
        sort_name_asc: "Từ A - Z",
        sort_name_desc: "Từ Z - A",
        rate_1_star: "⭐ 1 sao",
        rate_2_stars: "⭐⭐ 2 sao",
        rate_3_stars: "⭐⭐⭐ 3 sao",
        rate_4_stars: "⭐⭐⭐⭐ 4 sao",
        rate_5_stars: "⭐⭐⭐⭐⭐ 5 sao",

        // --- TOP REVIEWS ---
        top_hero_pre: "Đề xuất của <span class='logo-text-styled'>StayWise</span>",
        top_hero_main: "Khám phá top 10 khách sạn tốt nhất",
        top_select_default: "Chọn địa điểm du lịch",
        top_list_title_default: "Vui lòng chọn địa điểm du lịch",
        top_explanation: "Xếp hạng này dựa trên điểm số trung bình tổng hợp cao nhất từ StayWise và các nguồn đối tác, áp dụng cho các khách sạn có tối thiểu 50 đánh giá trở lên.",
        top_title_prefix: "Top 10 khách sạn tốt nhất tại",
        top_no_result: "Không tìm thấy khách sạn nào ở {city} đạt trên 50 đánh giá để xếp hạng Top 10.",

        // --- FAVOURITE ---
        fav_title: "CHỖ Ở YÊU THÍCH",
        fav_subtitle: "Chỗ ở đã lưu của bạn",
        sort_recent: "Mới thêm gần đây",
        sort_rating_desc: "Đánh giá cao nhất",
        loading_fav: "Đang tải danh sách yêu thích...",
        empty_fav_title: "Bạn chưa lưu chỗ ở nào",
        empty_fav_desc: "Hãy khám phá và thả tim cho những nơi bạn thích nhé!",
        btn_explore_now: "Khám phá ngay",
        modal_del_title: "Xác nhận xóa",
        modal_del_desc: "Bạn có chắc chắn muốn bỏ khách sạn này khỏi danh sách yêu thích?",
        btn_cancel: "Hủy bỏ",
        btn_delete: "Xóa ngay",

        // --- FOOTER ---
        footer_desc: "Tìm kiếm chỗ ở phù hợp với yêu cầu và sở thích của bạn",
        footer_about: "Giới thiệu",
        footer_about_us: "Về chúng tôi",
        footer_faq: "FAQ",
        footer_policy: "Điều khoản & chính sách",
        footer_contact_link: "Liên hệ",
        footer_contact_info: "Thông tin liên hệ",
        footer_copyright: "&copy; 2025 StayWise. Bảo lưu mọi quyền.",

        // --- INFO PAGE ---
        info_modal_desc_title: "Mô tả Khách sạn",
        info_price_label: "Giá/ 1 phòng/ 1 đêm từ",
        info_desc_heading: "Mô tả khách sạn",
        btn_show_more_desc: "Xem thêm mô tả chi tiết",
        info_fac_heading: "Các tiện ích chính",
        info_attract_heading: "Địa điểm lân cận",
        info_all_fac_heading: "Tất cả tiện ích",
        fac_group_service: "Tiện ích dịch vụ",
        fac_group_public: "Tiện ích công cộng",
        fac_group_general: "Tiện ích chung",
        fac_group_room: "Tiện ích phòng",
        info_review_heading: "Đánh giá của khách hàng",
        tab_other_source: "Các nguồn khác",
        from_text: "Từ",
        reviews_text: "đánh giá",
        by_staywise_guest: "Bởi khách du lịch trong Staywise",
        from_other_source: "Từ các nguồn đánh giá khác",
        review_form_title: "Viết đánh giá của bạn",
        lbl_review_score: "Điểm đánh giá (1 - 10)",
        lbl_review_comment: "Nhận xét của bạn",
        ph_review_comment: "Chia sẻ trải nghiệm của bạn",
        btn_send_review: "Gửi đánh giá",
        del_review_title: "Xác nhận xóa bình luận",
        del_review_desc: "Bạn có chắc chắn muốn xóa bình luận này? Hành động này không thể hoàn tác.",
        btn_delete_now: "Xóa ngay",

        // --- FAQ PAGE ---
        faq_header_title: "Câu hỏi thường gặp",
        faq_header_subtitle: "Chúng tôi có thể giúp gì cho bạn?",
        faq_group_account: "Tài khoản & Đặt phòng",
        faq_q1_text: "Làm thế nào để đặt phòng trên StayWise?",
        faq_a1_text: "Bạn có thể tìm kiếm khách sạn theo địa điểm, ngày đi và số lượng người. Sau đó chọn khách sạn ưng ý, xem chi tiết phòng và nhấn nút 'Đặt ngay'. Bạn cũng có thể nhờ Chatbot AI gợi ý khách sạn phù hợp.",
        faq_q2_text: "Tôi có cần tạo tài khoản để đặt phòng không?",
        faq_a2_text: "Không bắt buộc. Tuy nhiên, chúng tôi khuyên bạn nên đăng ký tài khoản để dễ dàng quản lý lịch sử đặt phòng, nhận ưu đãi riêng và lưu danh sách khách sạn yêu thích.",
        faq_group_payment: "Thanh toán & Hủy phòng",
        faq_q3_text: "Chính sách hủy phòng như thế nào?",
        faq_a3_text: "Chính sách hủy phòng phụ thuộc vào từng khách sạn cụ thể. Thông tin này được hiển thị rõ ràng trong trang chi tiết phòng và email xác nhận đặt phòng.",
        faq_q4_text: "Giá hiển thị đã bao gồm thuế và phí chưa?",
        faq_a4_text: "Giá hiển thị trên kết quả tìm kiếm là giá cơ bản. Tổng chi phí bao gồm thuế và phí dịch vụ sẽ được hiển thị chi tiết ở bước thanh toán cuối cùng trước khi bạn xác nhận.",
        faq_group_ai: "Về Chatbot AI",
        faq_q5_text: "Chatbot AI của StayWise có thể làm gì?",
        faq_a5_text: "Chatbot của chúng tôi có thể trả lời các câu hỏi về địa điểm du lịch, gợi ý khách sạn dựa trên sở thích (ví dụ: 'Tìm resort có hồ bơi ở Nha Trang giá dưới 2 triệu'), và hỗ trợ giải đáp thắc mắc cơ bản.",
        faq_q6_text: "Thông tin từ AI có chính xác tuyệt đối không?",
        faq_a6_text: "AI của chúng tôi được huấn luyện để đưa ra thông tin tốt nhất, nhưng nó vẫn có thể gặp sai sót hoặc dữ liệu chưa cập nhật kịp thời. Chúng tôi khuyến khích bạn kiểm tra lại thông tin chi tiết trên trang khách sạn trước khi đặt.",
        faq_contact_title: "Vẫn chưa tìm thấy câu trả lời?",
        faq_contact_desc: "Đừng ngần ngại liên hệ với đội ngũ hỗ trợ của chúng tôi.",
        faq_btn_contact: "Đặt câu hỏi ngay",
        chatbot_header: "AI StayWise",
        chatbot_welcome: "Xin chào! Tôi là AI của StayWise. Tôi có thể giúp bạn tìm khách sạn ưng ý.",
        chatbot_placeholder: "Nhập tin nhắn...",

        // --- POLICY PAGE ---
        policy_header_title: "Chính sách và Điều khoản",
        policy_header_desc: "Vui lòng đọc kỹ các điều khoản trước khi sử dụng dịch vụ của StayWise",
        policy_intro_title: "1. Giới thiệu chung",
        policy_intro_text: "Chào mừng bạn đến với <strong>StayWise</strong>. Bằng việc truy cập website và sử dụng các dịch vụ tìm kiếm, đặt phòng khách sạn cũng như tương tác với trợ lý ảo AI của chúng tôi, bạn đồng ý tuân thủ các Điều khoản sử dụng và Chính sách bảo mật dưới đây.",
        policy_ai_title: "2. Quy định về Trợ lý ảo AI (Chatbot)",
        policy_ai_box_title: '<i class="fas fa-robot"></i> Miễn trừ trách nhiệm AI',
        policy_ai_box_intro: "StayWise sử dụng công nghệ Trí tuệ nhân tạo (AI) tiên tiến để hỗ trợ bạn tìm kiếm thông tin nhanh chóng. Tuy nhiên:",
        policy_ai_li1: "<strong>Tính chất tham khảo:</strong> Các gợi ý về lịch trình, đánh giá, hoặc so sánh giá do Chatbot đưa ra chỉ mang tính chất tham khảo.",
        policy_ai_li2: "<strong>Khả năng sai sót:</strong> AI có thể cung cấp thông tin chưa cập nhật hoặc không chính xác trong một số trường hợp (ví dụ: tiện ích khách sạn vừa thay đổi).",
        policy_ai_li3: "<strong>Quyết định cuối cùng:</strong> Người dùng có trách nhiệm kiểm tra lại thông tin chi tiết (giá, địa chỉ, chính sách hủy) trên trang đặt phòng chính thức trước khi thanh toán. StayWise không chịu trách nhiệm cho các quyết định du lịch dựa hoàn toàn vào lời khuyên của AI.",
        policy_ai_sub_data: "Dữ liệu hội thoại",
        policy_ai_data_intro: "Khi bạn chat với StayWise AI, nội dung cuộc trò chuyện sẽ được lưu trữ nhằm mục đích:",
        policy_ai_data_li1: "Cải thiện chất lượng câu trả lời của AI trong tương lai.",
        policy_ai_data_li2: "Hỗ trợ bạn xem lại lịch sử tư vấn.",
        policy_ai_data_li3: "Gợi ý các khách sạn phù hợp với sở thích cá nhân của bạn (Cá nhân hóa).",
        policy_book_title: "3. Chính sách Đặt phòng & Thanh toán",
        policy_book_sub1: "Thông tin đặt phòng",
        policy_book_text1: "Người dùng phải đảm bảo cung cấp thông tin chính xác về họ tên, số điện thoại, email và số lượng người lưu trú. StayWise không chịu trách nhiệm nếu việc nhận phòng bị từ chối do sai lệch thông tin từ phía người dùng.",
        policy_book_sub2: "Giá và Thuế phí",
        policy_book_text2: "Giá hiển thị trên website có thể chưa bao gồm thuế và phí dịch vụ tùy thuộc vào quy định của từng khách sạn. Tổng số tiền thanh toán cuối cùng sẽ được hiển thị rõ ràng trước khi bạn xác nhận đặt phòng.",
        policy_book_sub3: "Hoàn hủy và Thay đổi",
        policy_book_text3: "Mỗi khách sạn trên hệ thống StayWise có chính sách hoàn hủy riêng (được ghi rõ trong trang chi tiết phòng). Vui lòng đọc kỹ trước khi đặt. Các yêu cầu hoàn tiền sẽ được xử lý theo quy định của khách sạn đó.",
        policy_privacy_title: "4. Chính sách Bảo mật",
        policy_privacy_intro: "Chúng tôi cam kết bảo mật thông tin cá nhân của bạn (Email, Số điện thoại, Lịch sử đặt phòng). Thông tin này chỉ được chia sẻ cho:",
        policy_privacy_li1: "<strong>Khách sạn/Đối tác lưu trú:</strong> Để hoàn tất thủ tục đặt phòng của bạn.",
        policy_privacy_li2: "<strong>Cơ quan pháp luật:</strong> Khi có yêu cầu hợp pháp từ cơ quan nhà nước có thẩm quyền.",
        policy_privacy_end: "Chúng tôi <strong>không</strong> bán dữ liệu cá nhân của bạn cho bên thứ ba vì mục đích quảng cáo khi chưa có sự đồng ý.",
        policy_conduct_title: "5. Quy tắc ứng xử",
        policy_conduct_intro: "Người dùng cam kết không sử dụng hệ thống Chatbot hoặc Website để:",
        policy_conduct_li1: "Gửi các nội dung thô tục, quấy rối, hoặc vi phạm pháp luật.",
        policy_conduct_li2: "Cố tình tấn công, spam hoặc khai thác lỗ hổng bảo mật của hệ thống AI.",
        policy_conduct_li3: "Sử dụng thông tin trên StayWise cho các mục đích thương mại mà không có sự cho phép.",
        policy_conduct_end: "Chúng tôi có quyền khóa tài khoản vĩnh viễn nếu phát hiện vi phạm các quy tắc trên.",
        policy_last_updated: "Cập nhật lần cuối: Ngày 29 tháng 11 năm 2025",

        // --- ABOUT US PAGE ---
        about_hero_title: "Về StayWise",
        about_hero_desc: "Nền tảng du lịch thông minh hàng đầu Việt Nam, mang đến trải nghiệm tìm kiếm, lựa chọn chỗ ở, lưu trú du lịch tối ưu với công nghệ AI",
        about_vision_title: "Tầm nhìn",
        about_vision_desc: "Trở thành nền tảng du lịch thông minh số 1 Việt Nam, kết nối hàng triệu du khách với những điểm đến tuyệt vời, đồng thời thúc đẩy phát triển du lịch bền vững và mang lại giá trị cho cộng đồng địa phương.",
        about_mission_title: "Sứ mệnh",
        about_mission_desc: "Chúng tôi cam kết mang đến cho du khách trải nghiệm du lịch tuyệt vời tại Việt Nam thông qua việc kết hợp công nghệ AI tiên tiến với dịch vụ chăm sóc khách hàng tận tâm, giúp mọi chuyến đi trở nên dễ dàng, thuận tiện và đáng nhớ.",
        about_core_values: "Giá trị cốt lõi",
        val_customer_title: "Khách hàng là trung tâm",
        val_customer_desc: "Luôn đặt nhu cầu và trải nghiệm của khách hàng lên hàng đầu trong mọi quyết định.",
        val_innovation_title: "Đổi mới sáng tạo",
        val_innovation_desc: "Không ngừng ứng dụng công nghệ mới để cải thiện dịch vụ và trải nghiệm người dùng.",
        val_quality_title: "Chất lượng vượt trội",
        val_quality_desc: "Cam kết cung cấp dịch vụ và sản phẩm chất lượng cao nhất cho mọi khách hàng.",

        // --- CONTACT PAGE ---
        contact_hero_title: "LIÊN HỆ VỚI CHÚNG TÔI",
        contact_hero_desc: "Chúng tôi luôn sẵn sàng hỗ trợ bạn. Hãy liên hệ với chúng tôi qua các kênh dưới đây hoặc điền form liên hệ!",
        contact_info_heading: "THÔNG TIN LIÊN HỆ",
        contact_label_address: "Địa chỉ",
        contact_address_val: "227 Nguyễn Văn Cừ, Phường Chợ Quán, Thành phố Hồ Chí Minh",
        contact_label_phone: "Số điện thoại",
        contact_label_email: "Email",
        contact_form_heading: "FORM LIÊN HỆ",
        contact_input_name: "Họ và tên",
        contact_input_email: "Email",
        contact_input_phone: "Số điện thoại",
        contact_input_message: "Nội dung",
        contact_btn_submit: "GỬI FORM LIÊN HỆ",
        curr_vnd_desc: "VND - Đồng Việt Nam",
        curr_usd_desc: "USD - Đô la Mỹ",
        profile_page_title: "Cài đặt hồ sơ - StayWise",
        settings_header: "Cài đặt",
        nav_info: "Thông tin tài khoản",
        nav_security: "Mật khẩu & Bảo mật",
        nav_notify: "Cài đặt thông báo",

        // Tab 1: Dữ liệu cá nhân
        sec_personal_title: "Dữ liệu cá nhân",
        lbl_fullname: "Tên đầy đủ",
        ph_fullname: "Nhập tên của bạn",
        help_fullname: "Tên trong hồ sơ được rút ngắn từ họ tên của bạn.",
        lbl_gender: "Giới tính",
        opt_gender_def: "Chọn giới tính",
        opt_gender_m: "Nam",
        opt_gender_f: "Nữ",
        opt_gender_o: "Khác",
        lbl_dob: "Ngày sinh",
        lbl_city: "Thành phố cư trú",
        ph_city: "Thành phố cư trú",
        btn_save_profile: "Lưu",

        // Tab 1: Số điện thoại
        sec_phone_title: "Số di động",
        sec_phone_desc: "Chỉ có thể sử dụng 1 số di động để nhận thông báo và bảo mật.",
        btn_add_phone: "+ Thêm số di động",
        btn_change_phone: "Đổi số khác", // Dùng trong JS
        btn_link_phone: "+ Liên kết SĐT", // Dùng trong JS
        txt_loading: "Đang tải...",
        txt_verified: "Đã xác thực", // Dùng trong JS

        // Tab 2: Bảo mật
        sec_security_title: "Mật khẩu & Bảo mật",
        card_pass_title: "Đổi mật khẩu",
        lbl_cur_pass: "Mật khẩu hiện tại",
        ph_cur_pass: "Nhập mật khẩu hiện tại để xác minh",
        lbl_new_pass: "Mật khẩu mới",
        ph_new_pass: "Tối thiểu 6 ký tự",
        lbl_conf_pass: "Xác nhận mật khẩu mới",
        ph_conf_pass: "Nhập lại mật khẩu mới",
        btn_update_pass: "Cập nhật mật khẩu",
        
        card_del_title: "Xóa tài khoản",
        card_del_desc: "Sau khi tài khoản của bạn bị xóa, bạn sẽ không thể phục hồi tài khoản hoặc dữ liệu của mình.",
        btn_del_acc: "Xoá",

        // Tab 3: Thông báo
        sec_notify_title: "Cài đặt thông báo",
        card_promo_title: "Khuyến mãi và ưu đãi",
        lbl_promo_sw: "Khuyến mãi StayWise",
        desc_promo_sw: "Nhận thông báo về các ưu đãi, giảm giá độc quyền.",
        card_acc_title: "Tài khoản và bảo mật",
        lbl_acc_status: "Trạng thái tài khoản",
        desc_acc_status: "Thông báo về đăng nhập, đổi mật khẩu và cập nhật bảo mật.",

        // Modal (Thêm SĐT & Xóa Acc)
        modal_add_phone_title: "THÊM SỐ ĐIỆN THOẠI",
        modal_add_phone_desc: "Thêm số điện thoại đang sử dụng của bạn để đăng nhập và nhận thông báo",
        lbl_modal_phone: "Điện thoại",
        ph_otp: "Nhập mã OTP 6 số",
        desc_otp_sent: "Mã OTP đã được gửi đến số điện thoại của bạn.",
        btn_modal_save: "Lưu",
        btn_modal_cancel: "Hủy",
        
        modal_del_title_confirm: "XÓA TÀI KHOẢN?",
        modal_del_desc_confirm: "Hành động này không thể hoàn tác. Để tiếp tục, vui lòng nhập mật khẩu của bạn.",
        ph_del_pass: "Nhập mật khẩu của bạn",
        btn_del_perm: "Xóa vĩnh viễn",
        nav_viewed: "Khách sạn đã xem", // Đã có trong sidebar
        sec_viewed_title: "Khách sạn đã xem gần đây",
        sec_viewed_desc: "Danh sách các khách sạn bạn đã xem qua.",
        txt_loading_data: "Đang tải dữ liệu...",
        txt_loading_data: "Đang tải dữ liệu...",
        msg_login_viewed: "Vui lòng đăng nhập để xem lịch sử.",
        msg_no_viewed: "Bạn chưa xem khách sạn nào gần đây.",
        msg_error_loading: "Lỗi khi tải dữ liệu."
    },
    en: {
        // --- HEADER ---
        nav_home: "Home",
        nav_explore: "Explore",
        nav_top_reviews: "Best Hotels",
        nav_fav: "Favorites",
        btn_login: "Login",
        btn_register: "Register",

        // --- SETTINGS MODAL ---
        modal_title: "Regional Settings",
        modal_lang: "Select Language",
        modal_curr: "Select Currency",
        btn_save: "Save Changes",

        // --- HOME PAGE ---
        hero_title: "Find the perfect stay<br>for you in Vietnam",
        placeholder_loc: "Location (City, area...)",

        // ⭐ SỬA: Bỏ chữ (VND) cứng để code tự thêm động
        placeholder_min: "Min Price", 
        placeholder_max: "Max Price",

        stat_props: "Properties",
        stat_provs: "City",
        stat_rating: "Avg Rating",
        why_title: "Why choose StayWise?",
        feat_ai: "AI-Powered Recommendations",
        feat_ai_desc: "Get personalized recommendations based on your preferences and travel style.",
        feat_verify: "Verified Accommodations",
        feat_verify_desc: "All properties are verified and rated by real travelers.",
        feat_support: "24/7 Support",
        feat_support_desc: "Our team is always ready to support you with any questions.",
        pop_hotel_title: "Popular Accommodations",
        pop_hotel_sub: "Discover stays carefully selected by travelers",
        pop_dest_title: "Famous Tourist Destinations",

        // --- AUTH MODALS ---
        login_title: "Login",
        login_subtitle: "Welcome back to StayWise",
        label_email: "Email",
        label_password: "Password",
        ph_email: "Enter your email address",
        ph_password: "Enter password",
        btn_login_submit: "Login",
        link_forgot_pass: "Forgot password?",
        text_no_account: "Don't have an account?",
        link_register_here: "Register here.",
        text_or: "Or",
        btn_login_google: "Login with Google",
        btn_login_facebook: "Login with Facebook",
        signup_title: "Register",
        signup_subtitle: "Welcome to StayWise",
        label_fullname: "Full Name",
        ph_fullname: "Your full name",
        label_confirm_pass: "Confirm Password",
        ph_confirm_pass: "Re-enter password",
        btn_signup_submit: "Register",
        text_have_account: "Already have an account?",
        link_login_here: "Login here.",
        forgot_title: "Password Recovery",
        forgot_subtitle: "Enter your registered email to receive password reset instructions.",
        btn_send_request: "Send Request",
        link_back_login: "Back to Login",

        // --- EXPLORE ---
        explore_hero_title: "EXPLORE STAYS",
        explore_hero_subtitle: "Find the perfect accommodation from over 10,000 properties",
        filter_title: "Filters",
        btn_reset_filter: "Reset all",
        lbl_location: "Search Location",
        ph_location: "City or area...",
        lbl_stay_type: "Accommodation Type",
        opt_all_types: "All types",
        opt_hotel: "Hotel",
        opt_apartment: "Apartment",
        opt_resort: "Resort",
        opt_homestay: "Homestay, Motel",
        opt_other: "Other",
        lbl_price_range: "Price Range (per night)",
        ph_min: "Min",
        ph_max: "Max",
        lbl_rating: "Rating",
        opt_all_ratings: "All",
        lbl_main_fac: "Main Facilities",
        fac_ac: "Air Conditioning",
        fac_restaurant: "Restaurant",
        fac_pool: "Swimming Pool",
        fac_24h: "24h Front Desk",
        fac_parking: "Parking",
        fac_elevator: "Elevator",
        lbl_extra_fac: "Extra Facilities",
        fac_bellhop: "BellHop",
        fac_gym: "Gym",
        fac_laundry: "Laundry Service",
        btn_apply: "APPLY",
        sort_default: "Sort by",
        sort_price_asc: "Price: Low to High",
        sort_price_desc: "Price: High to Low",
        sort_name_asc: "Name: A - Z",
        sort_name_desc: "Name: Z - A",
        rate_1_star: "⭐ 1 star",
        rate_2_stars: "⭐⭐ 2 stars",
        rate_3_stars: "⭐⭐⭐ 3 stars",
        rate_4_stars: "⭐⭐⭐⭐ 4 stars",
        rate_5_stars: "⭐⭐⭐⭐⭐ 5 stars",

        // --- TOP REVIEWS ---
        top_hero_pre: "Recommended by <span class='logo-text-styled'>StayWise</span>",
        top_hero_main: "Discover Top 10 Best Hotels",
        top_select_default: "Select a destination",
        top_list_title_default: "Please select a destination",
        top_explanation: "This ranking is based on the highest aggregate average score from StayWise and partner sources, applied to hotels with at least 50 reviews.",
        top_title_prefix: "Top 10 Best Hotels in",
        top_no_result: "No hotels found in {city} with over 50 reviews for Top 10 ranking.",

        // --- FAVOURITE ---
        fav_title: "FAVORITE STAYS",
        fav_subtitle: "Your saved accommodations",
        sort_recent: "Recently Added",
        sort_rating_desc: "Highest Rated",
        loading_fav: "Loading favorites...",
        empty_fav_title: "No saved properties yet",
        empty_fav_desc: "Explore and heart the places you love!",
        btn_explore_now: "Explore Now",
        modal_del_title: "Remove Confirm",
        modal_del_desc: "Are you sure you want to remove this hotel from favorites?",
        btn_cancel: "Cancel",
        btn_delete: "Remove",

        // --- FOOTER ---
        footer_desc: "Find accommodation that suits your needs and preferences",
        footer_about: "About",
        footer_about_us: "About Us",
        footer_faq: "FAQ",
        footer_policy: "Terms & Policies",
        footer_contact_link: "Contact",
        footer_contact_info: "Contact Information",
        footer_copyright: "&copy; 2025 StayWise. All rights reserved.",

        // --- INFO PAGE ---
        info_modal_desc_title: "Hotel Description",
        info_price_label: "Price per room per night from",
        info_desc_heading: "Hotel Description",
        btn_show_more_desc: "See full description",
        info_fac_heading: "Main Facilities",
        info_attract_heading: "Nearby Attractions",
        info_all_fac_heading: "All Facilities",
        fac_group_service: "Service Facilities",
        fac_group_public: "Public Facilities",
        fac_group_general: "General Facilities",
        fac_group_room: "Room Facilities",
        info_review_heading: "Guest Reviews",
        tab_other_source: "Other Sources",
        from_text: "From",
        reviews_text: "reviews",
        by_staywise_guest: "By StayWise guests",
        from_other_source: "From other sources",
        review_form_title: "Write your review",
        lbl_review_score: "Score (1 - 10)",
        lbl_review_comment: "Your comment",
        ph_review_comment: "Share your experience",
        btn_send_review: "Submit Review",
        del_review_title: "Delete Comment",
        del_review_desc: "Are you sure you want to delete this comment? This action cannot be undone.",
        btn_delete_now: "Delete Now",

        // --- FAQ PAGE ---
        faq_header_title: "Frequently Asked Questions",
        faq_header_subtitle: "How can we help you?",
        faq_group_account: "Account & Booking",
        faq_q1_text: "How to book a room on StayWise?",
        faq_a1_text: "You can search for hotels by location, date, and number of guests. Then choose your preferred hotel, view room details, and click 'Book Now'. You can also ask our AI Chatbot to recommend suitable hotels.",
        faq_q2_text: "Do I need to create an account to book?",
        faq_a2_text: "Not required. However, we recommend registering an account to easily manage booking history, receive exclusive offers, and save your favorite hotels.",
        faq_group_payment: "Payment & Cancellation",
        faq_q3_text: "What is the cancellation policy?",
        faq_a3_text: "The cancellation policy depends on the specific hotel. This information is clearly displayed on the room detail page and in the booking confirmation email.",
        faq_q4_text: "Does the price include taxes and fees?",
        faq_a4_text: "The price shown in search results is the base price. The total cost including taxes and service fees will be detailed in the final payment step before you confirm.",
        faq_group_ai: "About AI Chatbot",
        faq_q5_text: "What can StayWise AI Chatbot do?",
        faq_a5_text: "Our Chatbot can answer questions about tourist destinations, suggest hotels based on preferences (e.g., 'Find a resort with a pool in Nha Trang under 2 million'), and support basic inquiries.",
        faq_q6_text: "Is the information from AI absolutely accurate?",
        faq_a6_text: "Our AI is trained to provide the best information, but it may still encounter errors or outdated data. We encourage you to double-check details on the hotel page before booking.",
        faq_contact_title: "Still haven't found the answer?",
        faq_contact_desc: "Don't hesitate to contact our support team.",
        faq_btn_contact: "Ask a Question",
        chatbot_header: "StayWise AI",
        chatbot_welcome: "Hello! I am StayWise AI. I can help you find your perfect stay.",
        chatbot_placeholder: "Enter a message...",

        // --- POLICY PAGE ---
        policy_header_title: "Terms and Policies",
        policy_header_desc: "Please read the terms carefully before using StayWise services",
        policy_intro_title: "1. General Introduction",
        policy_intro_text: "Welcome to <strong>StayWise</strong>. By accessing the website and using our hotel search, booking services, and AI virtual assistant, you agree to comply with the Terms of Use and Privacy Policy below.",
        policy_ai_title: "2. AI Assistant (Chatbot) Regulations",
        policy_ai_box_title: '<i class="fas fa-robot"></i> AI Disclaimer',
        policy_ai_box_intro: "StayWise uses advanced Artificial Intelligence (AI) technology to help you find information quickly. However:",
        policy_ai_li1: "<strong>Reference Nature:</strong> Suggestions on itineraries, reviews, or price comparisons provided by the Chatbot are for reference only.",
        policy_ai_li2: "<strong>Potential Errors:</strong> AI may provide outdated or inaccurate information in some cases (e.g., hotel amenities recently changed).",
        policy_ai_li3: "<strong>Final Decision:</strong> Users are responsible for verifying detailed information (price, address, cancellation policy) on the official booking page before payment. StayWise is not responsible for travel decisions based entirely on AI advice.",
        policy_ai_sub_data: "Conversation Data",
        policy_ai_data_intro: "When you chat with StayWise AI, the conversation content will be stored for the purpose of:",
        policy_ai_data_li1: "Improving AI response quality in the future.",
        policy_ai_data_li2: "Helping you review consultation history.",
        policy_ai_data_li3: "Suggesting hotels tailored to your personal preferences (Personalization).",
        policy_book_title: "3. Booking & Payment Policy",
        policy_book_sub1: "Booking Information",
        policy_book_text1: "Users must ensure accurate information regarding name, phone number, email, and number of guests. StayWise is not responsible if check-in is refused due to incorrect information from the user.",
        policy_book_sub2: "Prices and Taxes",
        policy_book_text2: "Prices shown on the website may not include taxes and service charges depending on the specific hotel's policy. The total final payment amount will be clearly displayed before you confirm your booking.",
        policy_book_sub3: "Cancellation and Changes",
        policy_book_text3: "Each hotel on the StayWise system has its own cancellation policy (clearly stated on the room detail page). Please read carefully before booking. Refund requests will be processed according to that hotel's regulations.",
        policy_privacy_title: "4. Privacy Policy",
        policy_privacy_intro: "We are committed to protecting your personal information (Email, Phone Number, Booking History). This information is only shared with:",
        policy_privacy_li1: "<strong>Hotels/Accommodation Partners:</strong> To complete your booking procedures.",
        policy_privacy_li2: "<strong>Legal Authorities:</strong> Upon legal request from competent state agencies.",
        policy_privacy_end: "We do <strong>NOT</strong> sell your personal data to third parties for advertising purposes without consent.",
        policy_conduct_title: "5. Code of Conduct",
        policy_conduct_intro: "Users agree not to use the Chatbot system or Website to:",
        policy_conduct_li1: "Send vulgar, harassing, or illegal content.",
        policy_conduct_li2: "Intentionally attack, spam, or exploit security vulnerabilities of the AI system.",
        policy_conduct_li3: "Use information on StayWise for commercial purposes without permission.",
        policy_conduct_end: "We reserve the right to permanently ban accounts if violations of the above rules are detected.",
        policy_last_updated: "Last updated: November 29, 2025",

        // --- ABOUT US PAGE ---
        about_hero_title: "About StayWise",
        about_hero_desc: "Vietnam's leading smart travel platform, optimizing accommodation search and selection with AI technology.",
        about_vision_title: "Vision",
        about_vision_desc: "To become Vietnam's #1 smart tourism platform, connecting millions of travelers with amazing destinations, while promoting sustainable tourism and creating value for local communities.",
        about_mission_title: "Mission",
        about_mission_desc: "We are committed to providing travelers with amazing experiences in Vietnam by combining advanced AI technology with dedicated customer care, making every trip easy, convenient, and memorable.",
        about_core_values: "Core Values",
        val_customer_title: "Customer Centric",
        val_customer_desc: "Always placing customer needs and experiences at the forefront of every decision.",
        val_innovation_title: "Innovation",
        val_innovation_desc: "Continuously applying new technologies to improve services and user experience.",
        val_quality_title: "Outstanding Quality",
        val_quality_desc: "Committed to providing the highest quality services and products for every customer.",

        // --- CONTACT PAGE ---
        contact_hero_title: "CONTACT US",
        contact_hero_desc: "We are always here to help. Contact us via the channels below or fill out the contact form!",
        contact_info_heading: "CONTACT INFORMATION",
        contact_label_address: "Address",
        contact_address_val: "227 Nguyen Van Cu, Cho Quan Ward, Ho Chi Minh City",
        contact_label_phone: "Phone Number",
        contact_label_email: "Email",
        contact_form_heading: "CONTACT FORM",
        contact_input_name: "Full Name",
        contact_input_email: "Email",
        contact_input_phone: "Phone Number",
        contact_input_message: "Message",
        contact_btn_submit: "SEND MESSAGE",
        curr_vnd_desc: "VND - Vietnamese Dong",
        curr_usd_desc: "USD - US Dollar",
        profile_page_title: "Profile Settings - StayWise",
        settings_header: "Settings",
        nav_info: "Account Info",
        nav_security: "Password & Security",
        nav_notify: "Notifications",

        // Tab 1: Personal Data
        sec_personal_title: "Personal Data",
        lbl_fullname: "Full Name",
        ph_fullname: "Enter your full name",
        help_fullname: "Name in profile is shortened from your full name.",
        lbl_gender: "Gender",
        opt_gender_def: "Select Gender",
        opt_gender_m: "Male",
        opt_gender_f: "Female",
        opt_gender_o: "Other",
        lbl_dob: "Date of Birth",
        lbl_city: "City of Residence",
        ph_city: "Enter city",
        btn_save_profile: "Save",

        // Tab 1: Phone
        sec_phone_title: "Mobile Number",
        sec_phone_desc: "Only 1 mobile number can be used for notifications and security.",
        btn_add_phone: "+ Add Phone Number",
        btn_change_phone: "Change Number",
        btn_link_phone: "+ Link Phone",
        txt_loading: "Loading...",
        txt_verified: "Verified",

        // Tab 2: Security
        sec_security_title: "Password & Security",
        card_pass_title: "Change Password",
        lbl_cur_pass: "Current Password",
        ph_cur_pass: "Enter current password to verify",
        lbl_new_pass: "New Password",
        ph_new_pass: "Min 6 chars",
        lbl_conf_pass: "Confirm Password",
        ph_conf_pass: "Re-enter new password",
        btn_update_pass: "Update Password",
        
        card_del_title: "Delete Account",
        card_del_desc: "Once deleted, you will not be able to recover your account or data.",
        btn_del_acc: "Delete",

        // Tab 3: Notifications
        sec_notify_title: "Notification Settings",
        card_promo_title: "Promotions & Offers",
        lbl_promo_sw: "StayWise Promotions",
        desc_promo_sw: "Receive notifications about exclusive offers and discounts.",
        card_acc_title: "Account & Security",
        lbl_acc_status: "Account Status",
        desc_acc_status: "Notifications about logins, password changes, and security updates.",

        // Modals
        modal_add_phone_title: "ADD PHONE NUMBER",
        modal_add_phone_desc: "Add your current mobile number for login and notifications",
        lbl_modal_phone: "Phone Number",
        ph_otp: "Enter 6-digit OTP",
        desc_otp_sent: "OTP has been sent to your phone number.",
        btn_modal_save: "Save",
        btn_modal_cancel: "Cancel",
        
        modal_del_title_confirm: "DELETE ACCOUNT?",
        modal_del_desc_confirm: "This action cannot be undone. To continue, please enter your password.",
        ph_del_pass: "Enter your password",
        btn_del_perm: "Delete Permanently",
        nav_viewed: "Viewed Hotels",
        sec_viewed_title: "Recently Viewed Hotels",
        sec_viewed_desc: "List of hotels you have viewed recently.",
        txt_loading_data: "Loading data...",
        txt_loading_data: "Loading data...",
        msg_login_viewed: "Please login to view history.",
        msg_no_viewed: "No recently viewed hotels.",
        msg_error_loading: "Error loading data."
    }
};

// 2. PUBLIC API
window.updateAppLanguage = () => {
    let currentLang = localStorage.getItem("staywise_lang") || "vi";
    if (window._internalUpdateText) {
        window._internalUpdateText(currentLang);
    }
};

// 3. MAIN LOGIC
function initSettingsFeature() {
    console.log("🔄 Initializing Settings feature...");

    const modal = document.getElementById("settings-modal");
    const triggerBtn = document.getElementById("settings-trigger");
    const mobileTriggerBtn = document.getElementById("mobile-settings-trigger");
    const closeBtn = document.getElementById("close-settings");
    const saveBtn = document.getElementById("save-settings-btn");

    if (!modal) {
        return; 
    }

    if (!triggerBtn && !mobileTriggerBtn) {
        return;
    }

    let tempLang = localStorage.getItem("staywise_lang") || "vi";
    let tempCurr = localStorage.getItem("staywise_curr") || "VND";

    // --- ĐỊNH NGHĨA CÁC HÀM CẬP NHẬT GIAO DIỆN ---

    // A. Hàm dịch văn bản
    window._internalUpdateText = (lang) => {
        const dict = UI_TRANSLATIONS[lang];
        if (!dict) return;
        
        const curr = localStorage.getItem("staywise_curr") || "VND";

        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.dataset.i18n;
            if (dict[key]) {
                if (key === 'ph_min' || key === 'ph_max') {
                     el.placeholder = `${dict[key]} (${curr})`;
                }
                else if ((el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') && el.hasAttribute('placeholder')) {
                    el.placeholder = dict[key];
                } 
                else {
                    el.innerHTML = dict[key];
                }
            }
        });
    };

    // B. Hàm cập nhật nút trên Header (SỬA ĐỔI: Dùng IMG)
    function updateHeaderButton(lang, curr) {
        const flagEl = document.getElementById("header-flag");
        const currEl = document.getElementById("header-currency");
        const mobileFlagEl = document.getElementById("mobile-header-flag");
        const mobileCurrEl = document.getElementById("mobile-header-currency");
        
        if (flagEl) {
            if (lang === "vi") {
                flagEl.src = "https://flagcdn.com/w40/vn.png";
                flagEl.alt = "Vietnam Flag";
            } else {
                flagEl.src = "https://flagcdn.com/w40/gb.png";
                flagEl.alt = "UK Flag";
            }
        }
        
        if (mobileFlagEl) {
            if (lang === "vi") {
                mobileFlagEl.src = "https://flagcdn.com/w40/vn.png";
                mobileFlagEl.alt = "Vietnam Flag";
            } else {
                mobileFlagEl.src = "https://flagcdn.com/w40/gb.png";
                mobileFlagEl.alt = "UK Flag";
            }
        }
        
        if (currEl) currEl.textContent = curr;
        if (mobileCurrEl) mobileCurrEl.textContent = curr;
    }

    // C. Cập nhật nhãn tiền tệ tĩnh (VND/USD cạnh ô nhập giá)
    function updateCurrencyLabels(curr) {
        document.querySelectorAll('.currency-unit-label').forEach(el => {
            el.innerText = curr; 
        });
    }

    // D. Hàm tô màu lựa chọn trong Modal
    function updateModalSelection(type, value) {
        const selector = type === "lang" ? ".lang-option" : ".curr-option";
        document.querySelectorAll(selector).forEach(item => {
            if(item.dataset.value === value) {
                item.classList.add("selected");
                const check = item.querySelector(".check-mark");
                if(check) check.style.display = "block";
            } else {
                item.classList.remove("selected");
                const check = item.querySelector(".check-mark");
                if(check) check.style.display = "none";
            }
        });
    }

    // --- THỰC THI NGAY KHI LOAD ---
    updateHeaderButton(tempLang, tempCurr);
    window._internalUpdateText(tempLang);
    updateCurrencyLabels(tempCurr);

    // --- SỰ KIỆN DOM ---
    const openModal = (e) => {
        e.stopPropagation();
        modal.classList.add("open");
        updateModalSelection("lang", tempLang);
        updateModalSelection("curr", tempCurr);
    };

    if (triggerBtn) {
        triggerBtn.addEventListener("click", openModal);
    }
    
    if (mobileTriggerBtn) {
        mobileTriggerBtn.addEventListener("click", openModal);
    }

    closeBtn?.addEventListener("click", () => modal.classList.remove("open"));
    
    modal.addEventListener("click", (e) => {
        if (e.target === modal) modal.classList.remove("open");
    });

    document.querySelectorAll(".lang-option").forEach(item => {
        item.addEventListener("click", function () {
            document.querySelectorAll(".lang-option").forEach(i => i.classList.remove("selected"));
            this.classList.add("selected");
            tempLang = this.dataset.value;
            // Visual feedback ngay lập tức trong modal
            updateModalSelection("lang", tempLang);
        });
    });

    document.querySelectorAll(".curr-option").forEach(item => {
        item.addEventListener("click", function () {
            document.querySelectorAll(".curr-option").forEach(i => i.classList.remove("selected"));
            this.classList.add("selected");
            tempCurr = this.dataset.value;
            // Visual feedback
            updateModalSelection("curr", tempCurr);
        });
    });

    saveBtn?.addEventListener("click", () => {
        // Lưu vào LocalStorage
        localStorage.setItem("staywise_lang", tempLang);
        localStorage.setItem("staywise_curr", tempCurr);
        
        // Cập nhật giao diện
        updateHeaderButton(tempLang, tempCurr);
        window._internalUpdateText(tempLang);
        updateCurrencyLabels(tempCurr);
        
        // Dispatch event để các file JS khác (như explore.js) biết mà render lại giá/tên
        window.dispatchEvent(new Event('staywise:langChanged'));

        modal.classList.remove("open");
        
        // Reload nhẹ để đảm bảo mọi thứ đồng bộ (tùy chọn)
        setTimeout(() => { location.reload(); }, 300);
    });
}

// Chạy khi DOM sẵn sàng hoặc khi Layout được load (nếu dùng include-layout.js)
document.addEventListener("DOMContentLoaded", () => {
    initSettingsFeature();
});

window.addEventListener("layoutLoaded", () => {
    initSettingsFeature();
});
