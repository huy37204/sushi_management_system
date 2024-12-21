USE SUSUSHISHI
GO

CREATE PROCEDURE getUserIdByAccount 
    @USERNAME NVARCHAR(50)
AS
BEGIN
    SELECT 
		AC.PASSWORD,
        CASE 
            WHEN AC.CUSTOMER_ID IS NULL THEN AC.EMPLOYEE_ID
            ELSE AC.CUSTOMER_ID 
        END AS Id,
        AC.ROLE,
        CASE 
            WHEN AC.CUSTOMER_ID IS NULL THEN E.FULL_NAME
            ELSE C.FULL_NAME
        END AS Name
    FROM ACCOUNT AC
    LEFT JOIN EMPLOYEE E ON AC.EMPLOYEE_ID = E.EMPLOYEE_ID
    LEFT JOIN CUSTOMER C ON AC.CUSTOMER_ID = C.CUSTOMER_ID
    WHERE AC.USERNAME = @USERNAME 
END

GO
CREATE PROC getMenuDropDownItem
AS
BEGIN
    -- T?o b?ng t?m d? luu k?t qu?
    CREATE TABLE #CategoryDish (
        CATEGORY_NAME NVARCHAR(50),
        DISH_NAME NVARCHAR(50)
    );

    -- L?y danh sách các món an theo CATEGORY_NAME
    INSERT INTO #CategoryDish (CATEGORY_NAME, DISH_NAME)
    SELECT 
        d.CATEGORY_NAME, 
        d.DISH_NAME
    FROM 
        (SELECT CATEGORY_NAME, DISH_NAME, ROW_NUMBER() OVER (PARTITION BY CATEGORY_NAME ORDER BY DISH_ID) AS RowNum 
         FROM DISH) d
    WHERE 
        d.RowNum <= 4; -- L?y t?i da 4 món an trong m?i danh m?c

    -- Tr? v? k?t qu? nhóm các món an theo CATEGORY_NAME
    SELECT 
        CATEGORY_NAME,
        STRING_AGG(DISH_NAME, ', ') AS DISHES
    FROM 
        #CategoryDish
    GROUP BY 
        CATEGORY_NAME;

    -- Xóa b?ng t?m
    DROP TABLE #CategoryDish;
END;
GO


GO
CREATE PROC getRevenueByDate
    @DATE DATE,
    @BranchId CHAR(4)
AS
BEGIN
    SELECT *
    FROM INVOICE I
    INNER JOIN ORDER_ O ON O.ORDER_ID = I.ORDER_ID
    WHERE O.BRANCH_ID = @BranchId 
      AND CAST(I.ISSUE_DATE AS DATE) = @DATE;
END

EXEC getRevenueByDate @DATE = '10-31-2019', @BranchId = 'B003'


GO
CREATE PROC getRevenueByMonth
    @Year INT,
    @Month INT,
    @BranchId CHAR(4)
AS
BEGIN
    SELECT *
    FROM INVOICE I
    JOIN ORDER_ O ON I.ORDER_ID = O.ORDER_ID AND O.BRANCH_ID = @BranchId
    WHERE YEAR(I.ISSUE_DATE) = @Year AND MONTH(I.ISSUE_DATE) = @Month;
END;

EXEC getRevenueByMonth @Year = '2024', @Month = '12', @BranchId = 'B003'

GO
CREATE PROC getRevenueByQuarter
    @Year INT,
    @Quarter INT,
    @BranchId CHAR(4)
AS
BEGIN
    DECLARE @StartDate DATE;
    DECLARE @EndDate DATE;

    -- Tính toán ph?m vi ngày c?a quý
    IF @Quarter = 1
    BEGIN
        SET @StartDate = CAST(@Year AS VARCHAR) + '-01-01'; -- Ngày b?t d?u quý 1
        SET @EndDate = CAST(@Year AS VARCHAR) + '-03-31'; -- Ngày k?t thúc quý 1
    END
    ELSE IF @Quarter = 2
    BEGIN
        SET @StartDate = CAST(@Year AS VARCHAR) + '-04-01'; -- Ngày b?t d?u quý 2
        SET @EndDate = CAST(@Year AS VARCHAR) + '-06-30'; -- Ngày k?t thúc quý 2
    END
    ELSE IF @Quarter = 3
    BEGIN
        SET @StartDate = CAST(@Year AS VARCHAR) + '-07-01'; -- Ngày b?t d?u quý 3
        SET @EndDate = CAST(@Year AS VARCHAR) + '-09-30'; -- Ngày k?t thúc quý 3
    END
    ELSE IF @Quarter = 4
    BEGIN
        SET @StartDate = CAST(@Year AS VARCHAR) + '-10-01'; -- Ngày b?t d?u quý 4
        SET @EndDate = CAST(@Year AS VARCHAR) + '-12-31'; -- Ngày k?t thúc quý 4
    END

    -- Truy v?n các hóa don theo quý
    SELECT *
    FROM INVOICE I
    JOIN ORDER_ O ON I.ORDER_ID = O.ORDER_ID
    WHERE O.BRANCH_ID = @BranchId
    AND I.ISSUE_DATE BETWEEN @StartDate AND @EndDate
END
SELECT * FROM INVOICE
EXEC getRevenueByQuarter @Year = 2022, @Quarter = 2, @BranchId = 'B003';

GO
CREATE PROC getRevenueByYear
	@Year INT,
    @BranchId CHAR(4)
AS
BEGIN
	SELECT *
	FROM INVOICE I
	JOIN ORDER_ O ON I.ORDER_ID = O.ORDER_ID
    WHERE O.BRANCH_ID = @BranchId
	AND YEAR(I.ISSUE_DATE) = @Year
END


EXEC getRevenueByYear @Year = 2024, @BranchId = 'B003'
	SELECT *, D.DEPARTMENT_ID, D.DEPARTMENT_NAME
	FROM EMPLOYEE E
	JOIN DEPARTMENT D ON D.DEPARTMENT_ID = E.DEPARTMENT_ID AND D.BRANCH_ID = 'B003'
SELECT * FROM DEPARTMENT
select * from dish

UPDATE INVOICE
SET DISCOUNT_AMOUNT = (
    SELECT MS.DISCOUNT_AMOUNT
    FROM MEMBERSHIP_CARD MS
    JOIN CUSTOMER C ON C.CUSTOMER_ID = MS.CUSTOMER_ID
    JOIN ORDER_ O ON O.CUSTOMER_ID = C.CUSTOMER_ID
    WHERE INVOICE.ORDER_ID = O.ORDER_ID

);

SELECT * FROM MEMBERSHIP_CARD
UPDATE Invoice
SET FINAL_AMOUNT = (
    SELECT 
        CASE 
            WHEN SUM(od.QUANTITY * d.DISH_PRICE) - DISCOUNT_AMOUNT < 0 THEN 0
            ELSE SUM(od.QUANTITY * d.DISH_PRICE) - DISCOUNT_AMOUNT
        END
    FROM ORDER_DISH od
    JOIN DISH d ON od.DISH_ID = d.DISH_ID
    WHERE od.ORDER_ID = Invoice.ORDER_ID
);

GO
CREATE PROC getRatingByDate
	@DATE DATE,
	@BranchId CHAR(4),
	@EmployeeId CHAR(7)
AS
BEGIN
	SELECT E.EMPLOYEE_ID, E.FULL_NAME, AVG(CAST(OFO.EMPLYEE_RATING AS FLOAT)) AS AVERAGE_RATE 
	FROM EMPLOYEE E
	JOIN OFFLINE_ORDER OFO ON OFO.EMPLOYEE_ID = E.EMPLOYEE_ID
	JOIN ORDER_ O ON O.ORDER_ID = OFO.OFORDER_ID AND O.ORDER_DATE = @DATE
	JOIN DEPARTMENT D ON D.DEPARTMENT_ID = E.DEPARTMENT_ID AND D.BRANCH_ID = @BranchId
	WHERE E.EMPLOYEE_ID = @EmployeeId
	GROUP BY E.EMPLOYEE_ID, E.FULL_NAME
END



EXEC getRatingByDate @DATE = '12-22-2018', @BranchId = 'B001', @EmployeeId = 'E014327'

GO
CREATE PROC getRatingByMonth
	@MONTH int,
	@YEAR int,
	@BranchId CHAR(4),
	@EmployeeId CHAR(7)
AS
BEGIN
	SELECT E.EMPLOYEE_ID, E.FULL_NAME, AVG(CAST(OFO.EMPLYEE_RATING AS FLOAT)) AS AVERAGE_RATE 
	FROM EMPLOYEE E
	JOIN OFFLINE_ORDER OFO ON OFO.EMPLOYEE_ID = E.EMPLOYEE_ID
	JOIN ORDER_ O ON O.ORDER_ID = OFO.OFORDER_ID AND YEAR(O.ORDER_DATE) = @YEAR AND MONTH(O.ORDER_DATE) = @MONTH
	JOIN DEPARTMENT D ON D.DEPARTMENT_ID = E.DEPARTMENT_ID AND D.BRANCH_ID = @BranchId
	WHERE E.EMPLOYEE_ID = @EmployeeId
	GROUP BY E.EMPLOYEE_ID, E.FULL_NAME
END

EXEC getRatingByMonth @MONTH = 12, @YEAR = 2018, @BranchId = 'B001', @EmployeeId = 'E014327'

GO
CREATE PROC getRatingByQuarter
	@Quarter INT,          -- Quý c?n tính toán (1, 2, 3, ho?c 4)
	@Year INT,             -- Nam c?n tính toán
	@BranchId CHAR(4),     -- Mã chi nhánh
	@EmployeeId CHAR(7)    -- Mã nhân viên
AS
BEGIN
	-- Bi?n luu ph?m vi ngày
	DECLARE @StartDate DATE;
	DECLARE @EndDate DATE;

	-- Tính toán ph?m vi ngày c?a quý
	IF @Quarter = 1
	BEGIN
		SET @StartDate = CAST(@Year AS VARCHAR) + '-01-01'; -- Ngày b?t d?u quý 1
		SET @EndDate = CAST(@Year AS VARCHAR) + '-03-31';   -- Ngày k?t thúc quý 1
	END
	ELSE IF @Quarter = 2
	BEGIN
		SET @StartDate = CAST(@Year AS VARCHAR) + '-04-01'; -- Ngày b?t d?u quý 2
		SET @EndDate = CAST(@Year AS VARCHAR) + '-06-30';   -- Ngày k?t thúc quý 2
	END
	ELSE IF @Quarter = 3
	BEGIN
		SET @StartDate = CAST(@Year AS VARCHAR) + '-07-01'; -- Ngày b?t d?u quý 3
		SET @EndDate = CAST(@Year AS VARCHAR) + '-09-30';   -- Ngày k?t thúc quý 3
	END
	ELSE IF @Quarter = 4
	BEGIN
		SET @StartDate = CAST(@Year AS VARCHAR) + '-10-01'; -- Ngày b?t d?u quý 4
		SET @EndDate = CAST(@Year AS VARCHAR) + '-12-31';   -- Ngày k?t thúc quý 4
	END

	-- L?y d? li?u di?m trung bình trong ph?m vi quý
	SELECT 
		E.EMPLOYEE_ID, 
		E.FULL_NAME, 
        AVG(CAST(OFO.EMPLYEE_RATING AS FLOAT)) AS AVERAGE_RATE 
	FROM EMPLOYEE E
	JOIN OFFLINE_ORDER OFO ON OFO.EMPLOYEE_ID = E.EMPLOYEE_ID
	JOIN ORDER_ O ON O.ORDER_ID = OFO.OFORDER_ID
	JOIN DEPARTMENT D ON D.DEPARTMENT_ID = E.DEPARTMENT_ID AND D.BRANCH_ID = @BranchId
	WHERE 
		E.EMPLOYEE_ID = @EmployeeId
		AND O.ORDER_DATE BETWEEN @StartDate AND @EndDate
	GROUP BY 
		E.EMPLOYEE_ID, 
		E.FULL_NAME;
END

GO
CREATE PROC getRatingByYear
	@YEAR INT,
	@BranchId CHAR(4),
	@EmployeeId CHAR(7)
AS
BEGIN
	SELECT E.EMPLOYEE_ID, 
           E.FULL_NAME, 
           AVG(CAST(OFO.EMPLYEE_RATING AS FLOAT)) AS AVERAGE_RATE  -- Ép ki?u thành FLOAT
	FROM EMPLOYEE E
	JOIN OFFLINE_ORDER OFO ON OFO.EMPLOYEE_ID = E.EMPLOYEE_ID
	JOIN ORDER_ O ON O.ORDER_ID = OFO.OFORDER_ID AND YEAR(O.ORDER_DATE) = @YEAR
	JOIN DEPARTMENT D ON D.DEPARTMENT_ID = E.DEPARTMENT_ID AND D.BRANCH_ID = @BranchId
	WHERE E.EMPLOYEE_ID = @EmployeeId
	GROUP BY E.EMPLOYEE_ID, E.FULL_NAME
END
select * from ONLINE_ORDER WHERE OORDER_ID = 'O023963'
GO

CREATE PROC payOrder
    @OrderId CHAR(7),
	@BranchId CHAR(7),
    @StaffRating INT,
    @OrderType NVARCHAR(50)
AS
BEGIN
    DECLARE @DiscountAmount DECIMAL(18, 2);
    DECLARE @FinalAmount DECIMAL(18, 2);
    DECLARE @TotalAmountForPoints DECIMAL(18, 2);
    DECLARE @Points INT;
    DECLARE @NewInvoiceId CHAR(7);
    DECLARE @CurrentMaxInvoiceId INT;
    DECLARE @TableNum TINYINT;

    -- Lấy giá trị lớn nhất của INVOICE_ID
    SELECT 
        @CurrentMaxInvoiceId = MAX(CAST(SUBSTRING(INVOICE_ID, 2, LEN(INVOICE_ID) - 1) AS INT))
    FROM 
        INVOICE;

    -- Tạo INVOICE_ID mới
    SET @NewInvoiceId = 'I' + RIGHT('000000' + CAST(@CurrentMaxInvoiceId + 1 AS VARCHAR), 6);

    -- Lấy số tiền giảm giá
    SELECT 
        @DiscountAmount = ISNULL(MC.DISCOUNT_AMOUNT, 0)
    FROM 
        [ORDER_]
    JOIN 
        CUSTOMER ON CUSTOMER.CUSTOMER_ID = [ORDER_].CUSTOMER_ID
    LEFT JOIN 
        MEMBERSHIP_CARD MC ON MC.CUSTOMER_ID = CUSTOMER.CUSTOMER_ID
    WHERE 
        [ORDER_].ORDER_ID = @OrderId;

    -- Tính toán tổng tiền cuối cùng
    SELECT 
        @FinalAmount = SUM(OD.QUANTITY * D.DISH_PRICE) - @DiscountAmount
    FROM 
        ORDER_DISH OD
    JOIN 
        DISH D ON D.DISH_ID = OD.DISH_ID
    WHERE 
        OD.ORDER_ID = @OrderId;

    IF @FinalAmount < 0 
        SET @FinalAmount = 0;

    -- Tính số tiền để cộng điểm
    SET @TotalAmountForPoints = @FinalAmount + @DiscountAmount;

    -- Tính số điểm (1 point = 100,000 VNĐ)
    SET @Points = FLOOR(@TotalAmountForPoints / 100000);

    -- Thêm hóa đơn mới vào bảng INVOICE
    INSERT INTO INVOICE (
        INVOICE_ID, 
        FINAL_AMOUNT, 
        DISCOUNT_AMOUNT, 
        ISSUE_DATE, 
        ISSUE_TIME, 
        ORDER_ID
    )
    VALUES (
        @NewInvoiceId, -- INVOICE_ID mới
        @FinalAmount,
        @DiscountAmount,
        GETDATE(), -- Ngày hiện tại
        CONVERT(TIME, GETDATE()), -- Thời gian hiện tại
        @OrderId
    );

    -- Nếu OrderType là Offline, cập nhật StaffRating vào bảng OFFLINE_ORDER
    IF @OrderType = 'Offline'
    BEGIN
        UPDATE OFFLINE_ORDER
        SET EMPLYEE_RATING = @StaffRating
        WHERE OFORDER_ID = @OrderId;
        -- Lấy Table ID để đặt lại trạng thái bàn
        SELECT @TableNum = TABLE_NUMBER
        FROM OFFLINE_ORDER
        WHERE OFORDER_ID = @OrderId;

        -- Cập nhật trạng thái bàn
        IF @TableNum IS NOT NULL
        BEGIN
            UPDATE [TABLE_]
            SET TABLE_STATUS = N'Còn trống'
            WHERE TABLE_NUM = @TableNum AND BRANCH_ID = @BranchId;
        END
    END
	IF @OrderType = 'Online'
	BEGIN
        -- Lấy Table ID để đặt lại trạng thái bàn
        SELECT @TableNum = TABLE_NUMBER
        FROM ONLINE_ORDER
        WHERE OORDER_ID = @OrderId;

        -- Cập nhật trạng thái bàn
        IF @TableNum IS NOT NULL
        BEGIN
            UPDATE [TABLE_]
            SET TABLE_STATUS = N'Còn trống'
            WHERE TABLE_NUM = @TableNum AND BRANCH_ID = @BranchId;
        END
    END

    -- Cập nhật điểm vào Membership_Card nếu khách hàng có thẻ
    IF EXISTS (
        SELECT 1 
        FROM [ORDER_] O
        JOIN CUSTOMER C ON O.CUSTOMER_ID = C.CUSTOMER_ID
        JOIN MEMBERSHIP_CARD MC ON C.CUSTOMER_ID = MC.CUSTOMER_ID
        WHERE O.ORDER_ID = @OrderId
    )
    BEGIN
        UPDATE MEMBERSHIP_CARD
        SET POINTS = POINTS + @Points
        FROM [ORDER_] O
        JOIN CUSTOMER C ON O.CUSTOMER_ID = C.CUSTOMER_ID
        WHERE O.ORDER_ID = @OrderId
          AND MEMBERSHIP_CARD.CUSTOMER_ID = C.CUSTOMER_ID;
    END
END
GO


GO
CREATE PROC deleteOrder
    @ORDER_ID CHAR(7),
    @ORDER_TYPE NVARCHAR(50),
    @BRANCH_ID CHAR(4)
AS
BEGIN
    BEGIN TRANSACTION;
    BEGIN TRY
        -- Xoá các b?n ghi trong ORDER_DISH
        DELETE FROM ORDER_DISH 
        WHERE ORDER_ID = @ORDER_ID;

        -- Ki?m tra lo?i don hàng và th?c hi?n xoá
        IF @ORDER_TYPE = 'Delivery'
        BEGIN
            DELETE FROM DELIVERY_ORDER
            WHERE DORDER_ID = @ORDER_ID;
        END
        ELSE IF @ORDER_TYPE = 'Offline'
        BEGIN
            -- Xoá t? b?ng OFFLINE_ORDER
            DELETE FROM OFFLINE_ORDER
            WHERE OFORDER_ID = @ORDER_ID;

            -- C?p nh?t tr?ng thái bàn TABLE_
            UPDATE TABLE_
            SET TABLE_STATUS = N'Còn tr?ng'
            FROM TABLE_ T
            JOIN OFFLINE_ORDER O ON T.TABLE_NUM = O.TABLE_NUMBER
            WHERE O.OFORDER_ID = @ORDER_ID AND T.BRANCH_ID = @BRANCH_ID;
        END
        ELSE IF @ORDER_TYPE = 'Online'
        BEGIN
            -- Xoá t? b?ng ONLINE_ORDER
            DELETE FROM ONLINE_ORDER
            WHERE OORDER_ID = @ORDER_ID;
        END

        -- Xoá ORDER
        DELETE FROM ORDER_
        WHERE ORDER_ID = @ORDER_ID;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        -- Rollback khi có l?i
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

CREATE PROCEDURE getInvoiceByPhone
    @CUSTOMER_PHONE VARCHAR(15) = NULL,
    @DATE DATE = NULL
AS
BEGIN
    -- N?u c? CUSTOMER_PHONE và DATE d?u NULL, tr? v? r?ng
    IF @CUSTOMER_PHONE IS NULL AND @DATE IS NULL
    BEGIN
        -- Tr? v? b?ng tr?ng cho k?t qu? hóa don
        SELECT TOP 0 
            I.INVOICE_ID, 
            I.FINAL_AMOUNT, 
            I.DISCOUNT_AMOUNT, 
            I.ISSUE_DATE, 
            I.ISSUE_TIME
        FROM INVOICE I;

        -- Tr? v? b?ng tr?ng cho danh sách món an
        SELECT TOP 0 
            I.INVOICE_ID,
            OD.DISH_ID,
            OD.QUANTITY AS AMOUNT,
            D.DISH_NAME,
            D.DISH_PRICE
        FROM INVOICE I
        LEFT JOIN ORDER_DISH OD ON I.ORDER_ID = OD.ORDER_ID
        LEFT JOIN DISH D ON D.DISH_ID = OD.DISH_ID;

        RETURN;
    END;

    -- Bi?n d? luu Invoice ID duy nh?t
    DECLARE @InvoiceId CHAR(7);

    -- Tìm khách hàng d?a trên s? di?n tho?i
    DECLARE @CustomerId CHAR(7) = (
        SELECT CUSTOMER_ID 
        FROM CUSTOMER
        WHERE PHONE_NUMBER = @CUSTOMER_PHONE
    );

    -- L?y hóa don phù h?p nh?t d?a trên CUSTOMER_ID và DATE
    SELECT I.INVOICE_ID, I.FINAL_AMOUNT, I.DISCOUNT_AMOUNT, I.ISSUE_DATE, I.ISSUE_TIME
    FROM INVOICE I
    LEFT JOIN [ORDER_] O ON O.ORDER_ID = I.ORDER_ID
    WHERE 
        (@CustomerId IS NULL OR O.CUSTOMER_ID = @CustomerId)
        AND (@DATE IS NULL OR CAST(I.ISSUE_DATE AS DATE) = @DATE)
    ORDER BY I.ISSUE_DATE DESC, I.ISSUE_TIME DESC;

    -- Danh sách món an c?a các hóa don
    SELECT 
        I.INVOICE_ID,
        OD.DISH_ID,
        OD.QUANTITY AS AMOUNT,
        D.DISH_NAME,
        D.DISH_PRICE
    FROM INVOICE I
    LEFT JOIN ORDER_DISH OD ON I.ORDER_ID = OD.ORDER_ID
    LEFT JOIN DISH D ON D.DISH_ID = OD.DISH_ID
    WHERE 
        (@CustomerId IS NULL OR I.ORDER_ID IN (
            SELECT ORDER_ID FROM [ORDER_] WHERE CUSTOMER_ID = @CustomerId
        ))
        AND (@DATE IS NULL OR CAST(I.ISSUE_DATE AS DATE) = @DATE)
    ORDER BY I.INVOICE_ID, D.DISH_NAME;
END;
GO

CREATE PROCEDURE createCustomerCardForNew
    @fullName NVARCHAR(50),
    @phoneNumber CHAR(15),
    @email CHAR(50),
    @identityCard CHAR(15),
    @gender NVARCHAR(5),
    @employeeId CHAR(7)
AS
BEGIN
    SET NOCOUNT ON;

    -- Kiểm tra nếu khách hàng đã tồn tại theo số điện thoại
    IF EXISTS (
        SELECT 1 
        FROM CUSTOMER 
        WHERE PHONE_NUMBER = @phoneNumber
    )
    BEGIN
        -- Kiểm tra nếu khách hàng đã có thẻ thành viên
        IF EXISTS (
            SELECT 1 
            FROM CUSTOMER C
            JOIN MEMBERSHIP_CARD MC ON C.CUSTOMER_ID = MC.CUSTOMER_ID
            WHERE C.PHONE_NUMBER = @phoneNumber
        )
        BEGIN
            -- Nếu khách hàng đã có thẻ, thoát khỏi thủ tục
            PRINT 'Khách hàng đã có thẻ thành viên.';
            RETURN;
        END
        ELSE
        BEGIN
            -- Nếu khách hàng chưa có thẻ, tạo thẻ cho khách hàng hiện tại
            DECLARE @existingCustomerId CHAR(7);
            SELECT @existingCustomerId = CUSTOMER_ID 
            FROM CUSTOMER 
            WHERE PHONE_NUMBER = @phoneNumber;

            -- Tạo CARD_ID mới
            DECLARE @newCardId CHAR(7);
            SELECT @newCardId = 'C' + RIGHT('00000' + CAST(ISNULL(MAX(CAST(SUBSTRING(CARD_ID, 2, 6) AS INT)), 0) + 1 AS NVARCHAR), 6)
            FROM MEMBERSHIP_CARD;

            INSERT INTO MEMBERSHIP_CARD (CARD_ID, CARD_TYPE, CUSTOMER_ID, DATE_ISSUED, EMPLOYEE_ID, POINTS, CARD_STATUS, DISCOUNT_AMOUNT)
            VALUES (
                @newCardId, 
                N'Thẻ thành viên', 
                @existingCustomerId, 
                GETDATE(), 
                @employeeId, 
                0, 
                'active', 
                0
            );

            PRINT 'Thẻ thành viên đã được tạo thành công cho khách hàng hiện tại.';
            RETURN;
        END
    END

    -- Nếu khách hàng chưa tồn tại, tạo mới khách hàng
    DECLARE @newCustomerId CHAR(7);
    SELECT @newCustomerId = RIGHT('000000' + CAST(ISNULL(MAX(CAST(LEFT(CUSTOMER_ID, 6) AS INT)), 0) + 1 AS NVARCHAR), 6) + 'C'
    FROM CUSTOMER;

    INSERT INTO CUSTOMER (CUSTOMER_ID, FULL_NAME, PHONE_NUMBER, EMAIL, IDENTITY_CARD, GENDER)
    VALUES (
        @newCustomerId, 
        @fullName, 
        @phoneNumber, 
        @email, 
        @identityCard, 
        @gender
    );

    -- Tạo CARD_ID mới
    DECLARE @newCardId1 CHAR(7);
    SELECT @newCardId1 = 'C' + RIGHT('00000' + CAST(ISNULL(MAX(CAST(SUBSTRING(CARD_ID, 2, 6) AS INT)), 0) + 1 AS NVARCHAR), 6)
    FROM MEMBERSHIP_CARD;

    INSERT INTO MEMBERSHIP_CARD (CARD_ID, CARD_TYPE, CUSTOMER_ID, DATE_ISSUED, EMPLOYEE_ID, POINTS, CARD_STATUS, DISCOUNT_AMOUNT)
    VALUES (
        @newCardId1, 
        N'Thẻ thành viên', 
        @newCustomerId, 
        GETDATE(), 
        @employeeId, 
        0, 
        'Active', 
        0
    );

END;
GO
CREATE PROCEDURE createCustomerCardForOld
    @phoneNumber CHAR(15),
    @identityCard CHAR(15),
    @employeeId CHAR(7)
AS
BEGIN
    -- 1. Cập nhật số căn cước công dân cho khách hàng có PHONE_NUMBER = @phoneNumber
    UPDATE CUSTOMER
    SET IDENTITY_CARD = @identityCard
    WHERE PHONE_NUMBER = @phoneNumber;

    -- 2. Lấy CUSTOMER_ID của khách hàng dựa trên PHONE_NUMBER
    DECLARE @customerId CHAR(7);
    SELECT @customerId = CUSTOMER_ID
    FROM CUSTOMER
    WHERE PHONE_NUMBER = @phoneNumber;

    -- 3. Kiểm tra nếu khách hàng đã có thẻ "Active"
    IF NOT EXISTS (
        SELECT 1
        FROM MEMBERSHIP_CARD MC
        WHERE MC.CUSTOMER_ID = @customerId
        AND MC.CARD_STATUS = 'Active'
    )
    BEGIN
        -- 4. Nếu không có thẻ "Active", tạo thẻ mới cho khách hàng

        -- Tạo mới CARD_ID (tăng dần)
        DECLARE @newCardId CHAR(7);
        SELECT @newCardId = 'C' + RIGHT('000000' + CAST(MAX(CAST(SUBSTRING(CARD_ID, 2, 6) AS INT)) + 1 AS VARCHAR(6)), 6)
        FROM MEMBERSHIP_CARD;

        -- Thêm thẻ mới vào bảng MEMBERSHIP_CARD
        INSERT INTO MEMBERSHIP_CARD (
            CARD_ID, CARD_TYPE, CUSTOMER_ID, DATE_ISSUED, EMPLOYEE_ID, POINTS, CARD_STATUS, DISCOUNT_AMOUNT
        )
        VALUES (
            @newCardId,  -- CARD_ID là giá trị mới
            N'Thẻ thành viên',  -- CARD_TYPE là 'Thẻ thành viên'
            @customerId,  -- CUSTOMER_ID là giá trị lấy từ khách hàng
            GETDATE(),  -- Ngày cấp thẻ
            @employeeId,  -- EMPLOYEE_ID là ID nhân viên tạo thẻ
            0,  -- POINTS là 0
            'Active',  -- CARD_STATUS là 'Active'
            0  -- DISCOUNT_AMOUNT là 0
        );
    END
END




SELECT * FROM RESTAURANT_BRANCH
SELECT * FROM TABLE_
SELECT * FROM CUSTOMER JOIN MEMBERSHIP_CARD ON MEMBERSHIP_CARD.CUSTOMER_ID = CUSTOMER.CUSTOMER_ID
SELECT * FROM MEMBERSHIP_CARD
SELECT * FROM INVOICE
JOIN ORDER_ O ON O.ORDER_ID = INVOICE.ORDER_ID AND O.BRANCH_ID = 'B003'
SELECT * FROM DISH WHERE DISH_ID = 'D015'
select * from ORDER_DISH WHERE ORDER_ID = 'O012016'
select * from ORDER_
select * from DELIVERY_ORDER
SELECT * FROM INVOICE
select * from ACCOUNT A
select * from RESTAURANT_BRANCH
select * from invoice WHERE YEAR(ISSUE_DATE) = '1997'
SELECT * FROM EMPLOYEE
SELECT * FROM BRANCH_RATING JOIN OFFLINE_ORDER OFO ON OFO.BRANCH_ID = BRANCH_RATING.BRANCH_ID AND OFO.EMPLOYEE_ID = 'E014327' AND YEAR(BRANCH_RATING.RATING_DATE) = 2022
SELECT * FROM OFFLINE_ORDER OFO JOIN ORDER_ O ON O.ORDER_ID = OFO.OFORDER_ID AND YEAR(O.ORDER_DATE) = '2024' ORDER BY OFO.EMPLOYEE_ID
SELECT * FROM ONLINE_ORDER
SELECT * FROM DELIVERY_ORDER
SELECT * FROM OFFLINE_ORDER
SELECT * FROM ORDER_ O
SELECT * FROM TABLE_ WHERE BRANCH_ID = 'B012' AND TABLE_STATUS = N'Còn tr?ng'
SELECT * FROM EMPLOYEE WHERE FULL_NAME = N'Bác Hưng Lêê'
SELECT * FROM ORDER_DISH
SELECT * FROM DEPARTMENT
select * from DISH
SELECT * FROM WORK_HISTORY WHERE EMPLOYEE_ID = 'E000003'
SELECT * FROM EMPLOYEE WHERE EMPLOYEE_ID ='E000003'
	

SELECT E.EMPLOYEE_ID, E.FULL_NAME,  AVG(CAST(OFO.EMPLYEE_RATING AS FLOAT)) AS AVERAGE_RATE 
	FROM EMPLOYEE E
	JOIN OFFLINE_ORDER OFO ON OFO.EMPLOYEE_ID = E.EMPLOYEE_ID
	JOIN ORDER_ O ON O.ORDER_ID = OFO.OFORDER_ID AND YEAR(O.ORDER_DATE) = 2024
	JOIN DEPARTMENT D ON D.DEPARTMENT_ID = E.DEPARTMENT_ID AND D.BRANCH_ID = 'B012'
	WHERE E.EMPLOYEE_ID = 'E000012'
	GROUP BY E.EMPLOYEE_ID, E.FULL_NAME

select * from customer